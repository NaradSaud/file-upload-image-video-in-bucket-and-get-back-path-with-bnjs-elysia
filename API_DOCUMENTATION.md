# Image Upload API Documentation

## Base URL
```
http://localhost:3000
```

## User API Endpoints

### 1. Register User
**POST** `/users/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "file": "[File object]"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "profileImage": "https://your-bucket.com/users/1696345200000-profile.jpg"
    },
    "hasProfileImage": true
  }
}
```

### 2. Get All Users
**GET** `/users/`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "profileImage": "https://your-bucket.com/users/1696345200000-profile.jpg"
      }
    ],
    "count": 1
  }
}
```

### 3. Get User by ID
**GET** `/users/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "profileImage": "https://your-bucket.com/users/1696345200000-profile.jpg"
    }
  }
}
```

### 4. Update User Profile Image
**PATCH** `/users/:id/profile-image`

**Request Body:**
```json
{
  "file": "[File object]"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "profileImage": "https://your-bucket.com/users/1696345200001-new-profile.jpg"
    },
    "newImageUrl": "https://your-bucket.com/users/1696345200001-new-profile.jpg"
  }
}
```

## Home API Endpoints

### 1. Create Home
**POST** `/homes/create`

**Request Body:**
```json
{
  "ownerId": 1,
  "address": "123 Main Street, City, State",
  "files": "[Array of File objects]"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "home": {
      "id": 1,
      "ownerId": 1,
      "address": "123 Main Street, City, State",
      "images": [
        "https://your-bucket.com/homes/1696345200000-house1.jpg",
        "https://your-bucket.com/homes/1696345200001-house2.jpg"
      ]
    },
    "imageCount": 2,
    "imageUrls": [
      "https://your-bucket.com/homes/1696345200000-house1.jpg",
      "https://your-bucket.com/homes/1696345200001-house2.jpg"
    ]
  }
}
```

### 2. Get All Homes
**GET** `/homes/`

**Response:**
```json
{
  "success": true,
  "data": {
    "homes": [
      {
        "id": 1,
        "ownerId": 1,
        "address": "123 Main Street, City, State",
        "images": [
          "https://your-bucket.com/homes/1696345200000-house1.jpg",
          "https://your-bucket.com/homes/1696345200001-house2.jpg"
        ]
      }
    ],
    "count": 1
  }
}
```

### 3. Get Home by ID
**GET** `/homes/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "home": {
      "id": 1,
      "ownerId": 1,
      "address": "123 Main Street, City, State",
      "images": [
        "https://your-bucket.com/homes/1696345200000-house1.jpg",
        "https://your-bucket.com/homes/1696345200001-house2.jpg"
      ]
    }
  }
}
```

## Media API Endpoints

### 1. Upload Single Image
**POST** `/media/upload`

**Request Body:**
```json
{
  "file": "[File object]",
  "folder": "users"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://your-bucket.com/users/1696345200000-image.jpg"
}
```

### 2. Upload Multiple Images
**POST** `/media/upload-multiple`

**Request Body:**
```json
{
  "files": "[Array of File objects]",
  "folder": "homes"
}
```

**Response:**
```json
{
  "success": true,
  "urls": [
    "https://your-bucket.com/homes/1696345200000-image1.jpg",
    "https://your-bucket.com/homes/1696345200001-image2.jpg"
  ]
}
```

### 3. Delete Image
**DELETE** `/media/delete`

**Request Body:**
```json
{
  "path": "users/1696345200000-image.jpg"
}
```

**Response:**
```json
{
  "success": true
}
```

### 4. Get Image URL
**GET** `/media/get/:path`

**Response:**
```json
{
  "url": "https://your-bucket.com/users/1696345200000-image.jpg"
}
```

## Error Responses

All endpoints return error responses in this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Environment Variables Required

```env
DO_SPACES_BUCKET=your-bucket-name
BUCKET_URL=https://your-bucket.com
DATABASE_URL=your-database-connection-string
```

## File Upload Notes

- Supported image formats: JPG, PNG, GIF, WEBP
- Maximum file size: Depends on your S3/DigitalOcean Spaces configuration
- Files are automatically renamed with timestamp prefix to avoid conflicts
- All uploaded files are stored with public-read ACL

## Testing with curl

### Register a user:
```bash
curl -X POST http://localhost:3000/users/register \
  -F "name=John Doe" \
  -F "file=@/path/to/profile.jpg"
```

### Create a home:
```bash
curl -X POST http://localhost:3000/homes/create \
  -F "ownerId=1" \
  -F "address=123 Main Street" \
  -F "files=@/path/to/house1.jpg" \
  -F "files=@/path/to/house2.jpg"
```

### Get all users:
```bash
curl http://localhost:3000/users/
```

### Get all homes:
```bash
curl http://localhost:3000/homes/
```