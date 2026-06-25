# Stage 1

## Overview

This document outlines the REST API design for a campus notification platform. Students receive real-time updates for Placements, Events, and Results when they are logged in.

---

## Core Actions the Platform Supports

- Fetch all notifications for a logged-in student
- Fetch a single notification by ID
- Mark a notification as read
- Mark all notifications as read
- Delete a notification
- Filter notifications by type

---

## REST API Endpoints

### 1. Get All Notifications

**GET** `/api/notifications`

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Query Params (optional):
```
?type=Placement
?type=Result
?type=Event
```

Success Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id": "cac847bb-2ac6-4d15-a1bc-ce54107d3928",
      "type": "Placement",
      "message": "Amazon.com Inc. is hiring — apply now",
      "isRead": false,
      "createdAt": "2026-06-24T19:17:13Z"
    },
    {
      "id": "7f9610c9-14d3-403e-93f8-9ef113a1fc02",
      "type": "Result",
      "message": "Internal exam results are out",
      "isRead": true,
      "createdAt": "2026-06-24T16:18:07Z"
    }
  ],
  "total": 2
}
```

Error Responses:
```json
401: { "success": false, "error": "Unauthorized — invalid or expired token" }
500: { "success": false, "error": "Something went wrong, please try again" }
```

---

### 2. Get a Single Notification

**GET** `/api/notifications/:id`

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Success Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "id": "cac847bb-2ac6-4d15-a1bc-ce54107d3928",
    "type": "Event",
    "message": "Cult Fest is happening this Friday — don't miss it",
    "isRead": false,
    "createdAt": "2026-06-24T17:18:34Z"
  }
}
```

Error Responses:
```json
401: { "success": false, "error": "Unauthorized — invalid or expired token" }
404: { "success": false, "error": "Notification not found" }
500: { "success": false, "error": "Something went wrong, please try again" }
```

---

### 3. Mark a Notification as Read

**PATCH** `/api/notifications/:id/read`

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

No request body needed.

Success Response `200 OK`:
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "cac847bb-2ac6-4d15-a1bc-ce54107d3928",
    "isRead": true
  }
}
```

Error Responses:
```json
401: { "success": false, "error": "Unauthorized — invalid or expired token" }
404: { "success": false, "error": "Notification not found" }
500: { "success": false, "error": "Something went wrong, please try again" }
```

---

### 4. Mark All Notifications as Read

**PATCH** `/api/notifications/read-all`

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

No request body needed.

Success Response `200 OK`:
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updatedCount": 14
}
```

Error Responses:
```json
401: { "success": false, "error": "Unauthorized — invalid or expired token" }
500: { "success": false, "error": "Something went wrong, please try again" }
```

---

### 5. Delete a Notification

**DELETE** `/api/notifications/:id`

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Success Response `200 OK`:
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

Error Responses:
```json
401: { "success": false, "error": "Unauthorized — invalid or expired token" }
404: { "success": false, "error": "Notification not found" }
500: { "success": false, "error": "Something went wrong, please try again" }
```

---

## Real-Time Notifications using WebSockets

For real-time delivery, the platform uses WebSockets. When a new notification is created (e.g. HR clicks "Notify All"), it is pushed instantly to all connected students without them needing to refresh.

### How It Works

**1. Client connects on login:**
```
ws://your-server.com/ws?token=<Bearer token>
```

The server validates the token on connection. If invalid, the connection is rejected immediately.

**2. Server pushes a new notification:**

Whenever a new notification is created for a student, the server emits this event to their WebSocket connection:
```json
{
  "event": "new_notification",
  "data": {
    "id": "f60f7713-fd7a-494f-afd2-cd20a716a687",
    "type": "Placement",
    "message": "PayPal Holdings Inc. is hiring — check the portal",
    "isRead": false,
    "createdAt": "2026-06-24T20:18:16Z"
  }
}
```

**3. Client listens and updates the UI:**
```javascript
const ws = new WebSocket(`ws://your-server.com/ws?token=${token}`);

ws.onmessage = (event) => {
  const { data } = JSON.parse(event.data);
  // add new notification to the top of the list in UI
};

ws.onclose = () => {
  // attempt reconnect after 3 seconds
  setTimeout(reconnect, 3000);
};
```

**4. Disconnect handling:**

If a student closes the browser or loses connection, the server removes them from the active connections map. When they reconnect, they fetch missed notifications via `GET /api/notifications`.
