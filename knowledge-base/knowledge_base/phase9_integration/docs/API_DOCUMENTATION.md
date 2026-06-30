# WHO ITA Knowledge Base API Documentation

## Overview

The WHO ITA Knowledge Base API provides programmatic access to the International 
Standard Terminologies on Ayurveda as defined by the World Health Organization.

## Base URL

```
/api/v1/ita
```

## Authentication

Currently, the API is open for authenticated Ayurvritta users. Include the 
session token in the Authorization header.

## Endpoints

### GET /lookup/{termId}

Retrieve a single term by its WHO ITA code.

**Example:**
```bash
curl /api/v1/ita/lookup/ITA-1.1.1
```

**Response:**
```json
{
  "term_id": "ITA-1.1.1",
  "english": "Ayurveda",
  "iast": "āyurveda",
  "devanagari": "आयुर्वेद",
  "chapter": "1",
  "chapter_name": "Background Terminology",
  "domains": ["general"],
  "confidence": "high"
}
```

### GET /search?q={query}

Search terms by keyword.

**Parameters:**
- `q` (required): Search query
- `chapter` (optional): Filter by chapter (1-10)
- `limit` (optional): Maximum results (default: 20)

**Example:**
```bash
curl /api/v1/ita/search?q=vata&chapter=2&limit=10
```

### GET /autocomplete?prefix={prefix}

Get autocomplete suggestions.

**Parameters:**
- `prefix` (required): Minimum 2 characters

### POST /validate

Validate IAST-Devanagari consistency.

**Request Body:**
```json
{
  "iast": "āyurveda",
  "devanagari": "आयुर्वेद"
}
```

### GET /chapters

List all WHO ITA chapters with term counts.

## Error Codes

| Code | Description |
|------|-------------|
| 404 | Term not found |
| 400 | Invalid request parameters |
| 500 | Server error |

## Rate Limits

- 100 requests per minute per user
- 1000 requests per hour per user

## Support

For issues, contact: support@ayurvritta.com
