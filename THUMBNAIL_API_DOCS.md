# Thumbnail API Documentation

## 🖼️ **Thumbnail Generation Features**

The system now supports automatic thumbnail generation for images and videos with multiple sizes and scalable folder structure.

### **Supported File Types for Thumbnails:**
- **Images:** JPEG, PNG, WebP, BMP
- **Videos:** MP4, MPEG, QuickTime, AVI, WebM

### **Thumbnail Sizes Generated:**
- **Small:** 150x150px (Quality: 80%)
- **Medium:** 300x300px (Quality: 85%) 
- **Large:** 600x600px (Quality: 90%)

---

## 📁 **Folder Structure**

```
bucket/
├── users/
│   ├── 1696345200000-profile.jpg          (original)
│   └── thumbnails/
│       ├── 1696345200000-profile_thumb_sm.jpg  (150x150)
│       ├── 1696345200000-profile_thumb_md.jpg  (300x300)
│       └── 1696345200000-profile_thumb_lg.jpg  (600x600)
└── homes/
    ├── 1696345200001-house.mp4            (original)
    └── thumbnails/
        ├── 1696345200001-house_thumb_sm.jpg    (150x150)
        ├── 1696345200001-house_thumb_md.jpg    (300x300)
        └── 1696345200001-house_thumb_lg.jpg    (600x600)
```

---

## 🚀 **API Endpoints**

### **1. Upload Single File with Thumbnails**
```
POST /media/upload-with-thumbnails
```

**Form Data:**
- `file`: File (required)
- `folder`: Text (required) - e.g., "users", "homes"

**Response:**
```json
{
  "success": true,
  "url": "https://bucket.com/users/1696345200000-image.jpg",
  "thumbnails": {
    "small": "https://bucket.com/users/thumbnails/1696345200000-image_thumb_sm.jpg",
    "medium": "https://bucket.com/users/thumbnails/1696345200000-image_thumb_md.jpg", 
    "large": "https://bucket.com/users/thumbnails/1696345200000-image_thumb_lg.jpg"
  },
  "type": "image",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg"
  }
}
```

### **2. Upload Multiple Files with Thumbnails**
```
POST /media/upload-multiple-with-thumbnails
```

**Form Data:**
- `files`: Files (required) - select multiple
- `folder`: Text (required)

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "url": "https://bucket.com/homes/1696345200000-image1.jpg",
      "thumbnails": {
        "small": "https://bucket.com/homes/thumbnails/1696345200000-image1_thumb_sm.jpg",
        "medium": "https://bucket.com/homes/thumbnails/1696345200000-image1_thumb_md.jpg",
        "large": "https://bucket.com/homes/thumbnails/1696345200000-image1_thumb_lg.jpg"
      },
      "type": "image",
      "metadata": { "width": 1920, "height": 1080, "format": "jpeg" }
    },
    {
      "url": "https://bucket.com/homes/1696345200001-video.mp4",
      "thumbnails": {
        "small": "https://bucket.com/homes/thumbnails/1696345200001-video_thumb_sm.jpg",
        "medium": "https://bucket.com/homes/thumbnails/1696345200001-video_thumb_md.jpg",
        "large": "https://bucket.com/homes/thumbnails/1696345200001-video_thumb_lg.jpg"
      },
      "type": "video",
      "metadata": { "width": 1920, "height": 1080, "duration": 30.5, "format": "mp4" }
    }
  ],
  "count": 2,
  "summary": {
    "total": 2,
    "withThumbnails": 2,
    "images": 1,
    "videos": 1
  }
}
```

### **3. User Registration with Thumbnails**
```
POST /users/register
```

**Form Data:**
- `name`: Text (required)
- `file`: File (optional)
- `generateThumbnails`: Text - "true" or "false" (optional, default: false)

**Response with Thumbnails:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "profileImage": "https://bucket.com/users/1696345200000-profile.jpg"
    },
    "hasProfileImage": true,
    "thumbnails": {
      "small": "https://bucket.com/users/thumbnails/1696345200000-profile_thumb_sm.jpg",
      "medium": "https://bucket.com/users/thumbnails/1696345200000-profile_thumb_md.jpg",
      "large": "https://bucket.com/users/thumbnails/1696345200000-profile_thumb_lg.jpg"
    },
    "metadata": {
      "width": 1024,
      "height": 768,
      "format": "jpeg"
    },
    "fileType": "image"
  }
}
```

---

## 🧪 **Testing Examples**

### **Postman Setup for Thumbnail Upload:**

1. **URL:** `http://localhost:3000/media/upload-with-thumbnails`
2. **Method:** POST
3. **Body:** form-data
4. **Fields:**
   - `file`: [Select an image or video]
   - `folder`: `users`

### **User Registration with Thumbnails:**

1. **URL:** `http://localhost:3000/users/register`
2. **Method:** POST  
3. **Body:** form-data
4. **Fields:**
   - `name`: `John Doe`
   - `file`: [Select profile image]
   - `generateThumbnails`: `true`

### **cURL Examples:**

```bash
# Upload single file with thumbnails
curl -X POST http://localhost:3000/media/upload-with-thumbnails \
  -F "file=@image.jpg" \
  -F "folder=users"

# Upload multiple files with thumbnails  
curl -X POST http://localhost:3000/media/upload-multiple-with-thumbnails \
  -F "files=@image1.jpg" \
  -F "files=@video1.mp4" \
  -F "folder=homes"

# User registration with thumbnails
curl -X POST http://localhost:3000/users/register \
  -F "name=John Doe" \
  -F "file=@profile.jpg" \
  -F "generateThumbnails=true"
```

---

## ⚡ **Performance Notes**

- **Image thumbnails:** Generated using Sharp (fast)
- **Video thumbnails:** Generated using FFmpeg (slower, extracted from video frames)
- **Fallback:** If thumbnail generation fails, the original file upload still succeeds
- **Scalable:** Thumbnails are organized in separate `/thumbnails` subfolders
- **Async:** Thumbnail generation happens in parallel for multiple files

---

## 🛠️ **Technical Details**

### **Image Processing:**
- Uses Sharp library for high-performance image processing
- Maintains aspect ratio with center cropping
- JPEG output format for all thumbnails
- Adjustable quality settings per size

### **Video Processing:**
- Uses FFmpeg to extract frames at 1 second or 10% of duration
- Generates thumbnails from extracted frame
- Same size options as images
- Includes video metadata (duration, dimensions)

### **Storage Structure:**
- Original files: `folder/timestamp-filename.ext`
- Thumbnails: `folder/thumbnails/timestamp-filename_thumb_size.jpg`
- Public read access for all files
- Organized, scalable folder structure

The thumbnail system is production-ready and handles both images and videos efficiently! 🎉