# Waste Marketplace Backend

Express.js backend for the waste/recyclable products marketplace.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (free tier works)
- Flask ML API running on localhost:5000

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# MongoDB Atlas Connection String
# Get this from MongoDB Atlas > Database > Connect > Drivers
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waste-marketplace?retryWrites=true&w=majority

# JWT Secret - Generate a random string (32+ characters recommended)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-secure

# Server Port
PORT=3001

# Flask ML API URL (your existing ML model)
ML_API_URL=http://localhost:5000/predict

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

### 3. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account if you don't have one
3. Create a new cluster (free tier M0 is sufficient)
4. Click "Connect" on your cluster
5. Add your IP address to the whitelist (or use 0.0.0.0/0 for development)
6. Create a database user with password
7. Choose "Connect your application"
8. Copy the connection string and replace in your `.env` file

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start at `http://localhost:3001`

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |

### Categories
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | Get all categories | No |

### ML Prediction
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/ml/predict` | Classify waste image | Yes |

### Ads
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/ads` | Get all ads (with filters) | No |
| GET | `/api/ads/:id` | Get single ad | No |
| POST | `/api/ads` | Create new ad | Yes |
| GET | `/api/ads/user/my-ads` | Get user's ads | Yes |
| PUT | `/api/ads/:id` | Update ad | Yes |
| DELETE | `/api/ads/:id` | Delete ad | Yes |
| POST | `/api/ads/upload` | Upload ad images | Yes |

### Messages
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/messages/conversation` | Get/create conversation | Yes |
| GET | `/api/messages/conversations` | Get all conversations | Yes |
| POST | `/api/messages` | Send message | Yes |
| GET | `/api/messages/:conversationId` | Get conversation messages | Yes |
| GET | `/api/messages/unread/count` | Get unread count | Yes |

## Query Parameters for Ads

- `category` - Filter by category (cardboard, glass, metal, paper, plastic, trash)
- `city` - Filter by city
- `state` - Filter by state
- `search` - Search in title and description
- `sort` - Sort by: newest (default), oldest, price-low, price-high
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

Example:
```
GET /api/ads?category=plastic&city=Mumbai&sort=newest&page=1&limit=10
```

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### ML Prediction
```bash
curl -X POST http://localhost:3001/api/ml/predict \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

## Folder Structure

```
backend/
├── config/
│   ├── db.js           # MongoDB connection
│   └── categories.js   # Waste categories
├── controllers/
│   ├── authController.js
│   ├── adController.js
│   ├── mlController.js
│   └── messageController.js
├── middleware/
│   ├── auth.js         # JWT authentication
│   └── upload.js       # Multer file upload
├── models/
│   ├── User.js
│   ├── Ad.js
│   ├── Conversation.js
│   └── Message.js
├── routes/
│   ├── auth.js
│   ├── categories.js
│   ├── ml.js
│   ├── ads.js
│   └── messages.js
├── uploads/            # Uploaded images
├── server.js           # Entry point
├── package.json
├── .env.example
└── README.md
```

## Notes

- The ML prediction endpoint forwards images to your Flask API at `ML_API_URL`
- Uploaded images are stored in the `uploads/` folder
- JWT tokens expire after 30 days
- All protected routes require `Authorization: Bearer <token>` header
