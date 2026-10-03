# Event Slot Booker

Node.js + Express + MongoDB (Mongoose) REST API. Backend only, tested with Postman.

## Setup
```bash
npm install
# make sure MongoDB is running locally (or put an Atlas URI in .env)
npm run dev      # or: npm start
```
`.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/event-slot-booker
```

## Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/slots | Create event slot |
| GET | /api/slots | All slots with availableSeats |
| GET | /api/slots/:id | One slot + booking count |
| POST | /api/slots/:id/book | Book a slot |
| GET | /api/slots/:id/bookings | Active bookings of a slot |
| PATCH | /api/bookings/:id/cancel | Cancel a booking |
| DELETE | /api/slots/:id | Delete slot (blocked if active bookings) |
| PATCH | /api/slots/:id/status | Extra: set slot Open/Closed |

## Sample bodies
Create slot (`POST /api/slots`):
```json
{
  "eventName": "Node.js Workshop",
  "date": "2026-11-10",
  "startTime": "10:00",
  "endTime": "12:00",
  "location": "Seminar Hall A",
  "capacity": 2
}
```
Book (`POST /api/slots/:id/book`):
```json
{ "studentName": "Max", "email": "max@example.com", "rollNo": "ECE001" }
```

## Postman checklist
1. Create 2 slots with different capacities (e.g. 2 and 5).
2. Book several students -> 201.
3. Book again with same email -> 409 Duplicate booking.
4. Fill capacity (2 bookings on the capacity-2 slot), 3rd booking -> 409 Full Slot.
5. `PATCH /api/bookings/:id/cancel` on one booking, then GET the slot: availableSeats goes up by 1, booking works again.
6. Invalid slot ID (e.g. `/api/slots/123/book`) -> 400; missing studentName/email -> 400.
7. Delete a slot with active bookings -> 409; delete empty slot -> 200.
8. `PATCH /api/slots/:id/status` with `{ "status": "Closed" }`, then book -> 400 closed.
