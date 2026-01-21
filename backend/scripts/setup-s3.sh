#!/bin/bash

# S3 Setup Script for PDFtoLink
# Run this once to configure your S3 bucket

set -e

BUCKET_NAME="${AWS_S3_BUCKET:-pdftolink-uploads}"
REGION="${AWS_REGION:-us-east-1}"

echo "Setting up S3 bucket: $BUCKET_NAME in $REGION"

# Create bucket (if it doesn't exist)
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "✓ Bucket already exists"
else
    echo "Creating bucket..."
    if [ "$REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$BUCKET_NAME"
    else
        aws s3api create-bucket --bucket "$BUCKET_NAME" \
            --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
    fi
    echo "✓ Bucket created"
fi

# Enable versioning (optional, for recovery)
echo "Enabling versioning..."
aws s3api put-bucket-versioning --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled
echo "✓ Versioning enabled"

# Apply lifecycle policy for auto-expiration
echo "Applying lifecycle policy..."
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET_NAME" \
    --lifecycle-configuration file://s3-lifecycle-policy.json
echo "✓ Lifecycle policy applied (7-day expiration)"

# Configure CORS for browser uploads
echo "Configuring CORS..."
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
      "AllowedOrigins": ["http://localhost:5173", "http://localhost:3000", "https://*.vercel.app"],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3600
    }
  ]
}'
echo "✓ CORS configured"

# Block public access (we use presigned URLs)
echo "Configuring public access block..."
aws s3api put-public-access-block --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo "✓ Public access blocked"

echo ""
echo "=========================================="
echo "S3 Setup Complete!"
echo "=========================================="
echo ""
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"
echo ""
echo "Add these to your .env file:"
echo ""
echo "AWS_S3_BUCKET=$BUCKET_NAME"
echo "AWS_REGION=$REGION"
echo "AWS_ACCESS_KEY_ID=<your-access-key>"
echo "AWS_SECRET_ACCESS_KEY=<your-secret-key>"
echo ""
