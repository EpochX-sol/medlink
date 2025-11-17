# Telehealth MVP Backend

## Project Overview

This backend powers a telehealth MVP, enabling secure user management, doctor verification, appointment scheduling, chat messaging, prescriptions, and payment processing. Built with Node.js, Express, and MongoDB, it provides RESTful APIs for all core telehealth features, including video call support via Twilio.

---

## Tech Stack

| Technology   | Purpose                        |
|--------------|-------------------------------|
| Node.js      | Server runtime                 |
| Express      | Web framework                  |
| MongoDB      | Database                       |
| Mongoose     | ODM for MongoDB                |
| Twilio Video | Video call integration         |

---

## Models

### User

| Field      | Type      | Description                |
|------------|-----------|----------------------------|
| _id        | ObjectId  | Unique user ID             |
| name       | String    | Full name                  |
| email      | String    | Email address              |
| password   | String    | Hashed password            |
| role       | String    | 'patient' or 'doctor'      |
| createdAt  | Date      | Registration date          |

### DoctorProfile

| Field               | Type      | Description                          |
|---------------------|-----------|--------------------------------------|
| _id                 | ObjectId  | Unique profile ID                    |
| user_id             | ObjectId  | Linked User                          |
| specialty           | String    | Medical specialty                    |
| bio                 | String    | Doctor bio                           |
| availability        | Mixed     | Array of available times             |
| medicalLicenseNumber| String    | License number                       |
| documents           | Object    | { idCard, certificate }              |
| isVerified          | Boolean   | Verification status                  |
| verificationStatus  | String    | 'pending', 'approved', 'rejected'    |
| verificationNotes   | String    | Admin notes                          |
| createdAt           | Date      | Profile creation date                |

### Appointment

| Field         | Type      | Description                  |
|---------------|-----------|------------------------------|
| _id           | ObjectId  | Unique appointment ID        |
| patient_id    | ObjectId  | Linked User (patient)        |
| doctor_id     | ObjectId  | Linked User (doctor)         |
| scheduled_time| Date      | Appointment time             |
| status        | String    | 'booked', 'completed', 'cancelled' |
| roomName      | String    | Video room name (Twilio)     |
| createdAt     | Date      | Creation date                |

### Message (Chat)

| Field         | Type      | Description                  |
|---------------|-----------|------------------------------|
| _id           | ObjectId  | Unique message ID            |
| sender_id     | ObjectId  | Sender User                  |
| receiver_id   | ObjectId  | Receiver User                |
| appointment_id| ObjectId  | Linked Appointment           |
| content       | String    | Message text                 |
| timestamp     | Date      | Sent time                    |

### Prescription

| Field         | Type      | Description                  |
|---------------|-----------|------------------------------|
| _id           | ObjectId  | Unique prescription ID       |
| appointment_id| ObjectId  | Linked Appointment           |
| doctor_id     | ObjectId  | Prescribing doctor           |
| patient_id    | ObjectId  | Patient                      |
| medications   | Mixed     | Array of medication objects  |
| createdAt     | Date      | Creation date                |

---

## API Endpoints

### User

| Method | Route                | Purpose                |
|--------|----------------------|------------------------|
| POST   | /api/users/register  | Register new user      |
| POST   | /api/users/login     | Authenticate user      |
| GET    | /api/users/:id       | Get user profile       |
| PUT    | /api/users/:id       | Update user profile    |

**Example Request:**
```json
POST /api/users/register
{
   "name": "Alice Smith",
   "email": "alice@example.com",
   "password": "Password123!",
   "role": "patient"
}
```

**Example Response:**
```json
{
   "_id": "6919c1c7bac137f6101163e5",
   "name": "Alice Smith",
   "email": "alice@example.com",
   "role": "patient",
   "createdAt": "2025-11-16T12:21:27.194Z"
}
```

---

### DoctorProfile

| Method | Route                          | Purpose                        |
|--------|--------------------------------|--------------------------------|
| POST   | /api/doctors                   | Create doctor profile          |
| GET    | /api/doctors                   | List all doctors               |
| GET    | /api/doctors/:id               | Get doctor profile             |
| PUT    | /api/doctors/:id               | Update doctor profile          |
| DELETE | /api/doctors/:id               | Delete doctor profile          |
| GET    | /api/doctors/pending           | List pending verifications     |
| PUT    | /api/doctors/:id/approve       | Approve doctor profile         |
| PUT    | /api/doctors/:id/reject        | Reject doctor profile          |

**Example Request:**
```json
POST /api/doctors
{
   "user_id": "6919c1c7bac137f6101163e6",
   "specialty": "Cardiology",
   "bio": "Experienced cardiologist.",
   "availability": ["2025-11-17T09:00:00Z"],
   "medicalLicenseNumber": "CARD123456",
   "documents": { "idCard": "idcard1.png", "certificate": "cert1.pdf" }
}
```

**Example Response:**
```json
{
   "_id": "6919c314bac137f6101163f9",
   "user_id": "6919c1c7bac137f6101163e6",
   "specialty": "Cardiology",
   "isVerified": false,
   "verificationStatus": "pending"
}
```

---

### Appointment

| Method | Route                        | Purpose                        |
|--------|------------------------------|--------------------------------|
| POST   | /api/appointments            | Create appointment             |
| GET    | /api/appointments            | List appointments              |
| GET    | /api/appointments/:id        | Get appointment details        |
| PUT    | /api/appointments/:id        | Update appointment             |
| DELETE | /api/appointments/:id        | Cancel appointment             |

**Example Request:**
```json
POST /api/appointments
{
   "patient_id": "6919c1c7bac137f6101163e5",
   "doctor_id": "6919c1c7bac137f6101163e6",
   "scheduled_time": "2025-11-17T09:00:00Z"
}
```

**Example Response:**
```json
{
   "_id": "6919c38ebac137f610116403",
   "status": "booked"
}
```

---

### Message (Chat)

| Method | Route                        | Purpose                        |
|--------|------------------------------|--------------------------------|
| POST   | /api/messages                | Send message                   |
| GET    | /api/messages                | List messages                  |
| GET    | /api/messages/:id            | Get message                    |
| DELETE | /api/messages/:id            | Delete message                 |

**Example Request:**
```json
POST /api/messages
{
   "sender_id": "6919c1c7bac137f6101163e5",
   "receiver_id": "6919c1c7bac137f6101163e6",
   "appointment_id": "6919c38ebac137f610116403",
   "content": "Hello Doctor, I have chest pain."
}
```

---

### Prescription

| Method | Route                        | Purpose                        |
|--------|------------------------------|--------------------------------|
| POST   | /api/prescriptions           | Create prescription            |
| GET    | /api/prescriptions           | List prescriptions             |
| GET    | /api/prescriptions/:id       | Get prescription               |
| PUT    | /api/prescriptions/:id       | Update prescription            |
| DELETE | /api/prescriptions/:id       | Delete prescription            |

**Example Request:**
```json
POST /api/prescriptions
{
   "appointment_id": "6919c38ebac137f610116403",
   "doctor_id": "6919c1c7bac137f6101163e6",
   "patient_id": "6919c1c7bac137f6101163e5",
   "medications": [
      { "name": "Aspirin", "dosage": "100mg", "instructions": "Take once daily" }
   ]
}
```

---

### Payment

| Method | Route                              | Purpose                        |
|--------|------------------------------------|--------------------------------|
| POST   | /api/payments/initialize           | Start Chapa payment, get URL   |
| GET    | /api/payments/validate             | Validate payment (Chapa return)|
| GET    | /api/payments/:id                  | Get payment details            |

**Example Request:**
```json
POST /api/payments/initialize
{
   "appointment_id": "6919c38ebac137f610116403",
   "amount": 50,
   "currency": "ETB",
   "return_url": "http://localhost:3000/api/payments/validate"
}
```

**Example Response:**
```json
{
   "checkout_url": "https://checkout.chapa.co/...",
   "payment_id": "..."
}
```

---

### Video Call Support (Twilio)

| Method | Route                        | Purpose                        |
|--------|------------------------------|--------------------------------|
| POST   | /api/video/token             | Generate Twilio video token    |
| GET    | /api/video/room/:roomName    | Get video room info            |

**Example Request:**
```json
POST /api/video/token
{
   "identity": "user_id",
   "room": "room1"
}
```

**Example Response:**
```json
{
   "token": "TWILIO_JWT_TOKEN"
}
```

Video calls are linked to appointments via the `roomName` field.

---

## Doctor Verification Flow

- **Fields in DoctorProfile:**
   - `isVerified` (Boolean)
   - `verificationStatus` ('pending', 'approved', 'rejected')
   - `documents` (Object: idCard, certificate)
   - `verificationNotes` (String)

- **Endpoints:**
   - `GET /api/doctors/pending` – List all pending profiles
   - `PUT /api/doctors/:id/approve` – Approve profile
   - `PUT /api/doctors/:id/reject` – Reject profile

Only verified doctors (`isVerified: true`) can accept appointments.

---

## Setup Instructions (Backend Only)

1. **Clone the repository**
2. **Install dependencies**
    ```bash
    npm install
    ```
3. **Configure environment variables**  
    Create a `.env` file with:
    ```
    PORT=3000
    MONGODB_URI=your_mongodb_uri
    CHAPA_API_KEY=your_chapa_api_key
    TWILIO_ACCOUNT_SID=your_twilio_sid
    TWILIO_AUTH_TOKEN=your_twilio_token
    TWILIO_API_KEY=your_twilio_api_key
    TWILIO_API_SECRET=your_twilio_api_secret
    ```
4. **Run the server**
    ```bash
    npm start
    ```

---

## Notes / Usage

- Only verified doctors can accept or be assigned to appointments.
- All endpoints return JSON responses.
- Use the `/health` endpoint to check server and database status.
- Payments are processed via Chapa; use the returned `checkout_url` for user redirection.
- Video calls require Twilio credentials and are linked to appointments.

---

For questions or support, please contact the project maintainer.

## Models
Located in `model/`:
- **User.js**: Patient and doctor user accounts
- **DoctorProfile.js**: Doctor details, specialties, availability
- **Appointment.js**: Appointment scheduling, status, participants
- **Message.js**: Chat messages between users and doctors
- **Prescription.js**: Medication prescriptions, dosage, instructions
- **Payment.js**: (Optional) Payment records for appointments

---

## Controllers
Located in `controllers/`:
- **userController.js**: User registration, login, profile
- **doctorProfileController.js**: Doctor profile CRUD
- **appointmentController.js**: Appointment CRUD, status updates
- **messageController.js**: Messaging logic
- **prescriptionController.js**: Prescription CRUD
- **videoController.js**: Video session management (Twilio)
- **uploadController.js**: File upload handling

---

## Routes & APIs
Located in `routes/` and registered in `server.js`:

### User APIs (`/api/users`)
- `POST /register` — Register a new user
- `POST /login` — Authenticate user
- `GET /:id` — Get user profile
- `PUT /:id` — Update user profile

### Doctor APIs (`/api/doctors`)
- `GET /` — List all doctors
- `GET /:id` — Get doctor profile
- `POST /` — Create doctor profile
- `PUT /:id` — Update doctor profile
- `DELETE /:id` — Delete doctor profile

### Appointment APIs (`/api/appointments`)
- `GET /` — List all appointments
- `GET /:id` — Get appointment details
- `POST /` — Create appointment
- `PUT /:id` — Update appointment
- `DELETE /:id` — Cancel appointment

### Message APIs (`/api/messages`)
- `GET /` — List messages
- `GET /:id` — Get message
- `POST /` — Send message
- `DELETE /:id` — Delete message

### Prescription APIs (`/api/prescriptions`)
- `GET /` — List prescriptions
- `GET /:id` — Get prescription
- `POST /` — Create prescription
- `PUT /:id` — Update prescription
- `DELETE /:id` — Delete prescription

### Video APIs (`/api/video`)
- `POST /token` — Generate Twilio video token
- `POST /room` — Create video room

---

## Setup & Installation
1. **Clone the repository**
2. **Install dependencies**:
   ```powershell
   npm install
   ```
3. **Configure environment variables** in `.env`:
   - `PORT` — Server port
   - `MONGODB_URI` — MongoDB connection string
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, etc.
4. **Start the server**:
   ```powershell
   npm start
   ```

---

## Environment Variables
See `.env` and `config/twilio.js` for required Twilio and MongoDB settings.

---

## Health Check
- `GET /health` — Returns server status, database connection, and timestamp.

---

## Error Handling
Centralized error handler returns JSON error responses. In development, error messages are included.

---

## License
MIT (or specify your license)

---

## Contact
For questions or support, contact the maintainer.
