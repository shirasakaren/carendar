package service

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"

	appconfig "mgm.lab/calendar-backend/internal/config"
)

type S3 struct {
	client    *s3.Client
	uploader  *manager.Uploader
	bucket    string
	publicURL string
	region    string
}

func NewS3(ctx context.Context, cfg *appconfig.Config) (*S3, error) {
	awscfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(cfg.AWSRegion),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AWSAccessKeyID, cfg.AWSSecretAccessKey, "",
		)),
	)
	if err != nil {
		return nil, fmt.Errorf("aws load config: %w", err)
	}
	client := s3.NewFromConfig(awscfg)
	return &S3{
		client:    client,
		uploader:  manager.NewUploader(client),
		bucket:    cfg.AWSS3Bucket,
		publicURL: cfg.S3PublicBaseURL,
		region:    cfg.AWSRegion,
	}, nil
}

type UploadResult struct {
	URL  string `json:"url"`
	Name string `json:"name"`
	Type string `json:"type"`
	Size int64  `json:"size"`
}

var safeFilenamePattern = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

func sanitizeFilename(name string) string {
	base := filepath.Base(name)
	base = strings.TrimSpace(base)
	if base == "" || base == "." || base == "/" {
		base = "file"
	}
	base = safeFilenamePattern.ReplaceAllString(base, "_")
	if len(base) > 120 {
		ext := filepath.Ext(base)
		base = base[:120-len(ext)] + ext
	}
	return base
}

func (s *S3) Upload(ctx context.Context, originalName, contentType string, size int64, body io.Reader) (*UploadResult, error) {
	if s == nil {
		return nil, fmt.Errorf("s3 not configured")
	}
	safeName := sanitizeFilename(originalName)
	key := fmt.Sprintf("uploads/%s/%s-%s",
		time.Now().UTC().Format("2006/01/02"),
		uuid.NewString(),
		safeName,
	)
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	_, err := s.uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return nil, fmt.Errorf("s3 upload: %w", err)
	}

	var publicURL string
	if s.publicURL != "" {
		publicURL = fmt.Sprintf("%s/%s", s.publicURL, key)
	} else {
		publicURL = fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucket, s.region, key)
	}
	return &UploadResult{
		URL:  publicURL,
		Name: originalName,
		Type: contentType,
		Size: size,
	}, nil
}
