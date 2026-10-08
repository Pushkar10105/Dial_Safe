# API Contract

> **This file is the single source of truth for all endpoints.**
> All folders (bot, frontend, detection) must consume the API exactly as documented here.
> The contract is plain HTTP + JSON so each folder can use a different stack.
> If you need to change a response shape, update this file in the same PR, flag it in the PR template, and notify all owners.

---

## Endpoints

### `POST /check`

Check whether a phone number looks like a scam.

**Request body**
```json
{
  "number": "+919876543210",
  "brand": "Zomato"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `number` | string | yes | Phone number in any common format; the backend normalises it |
| `brand` | string | no | Brand name the caller claims this number belongs to |

**Response**
```json
{
  "number": "+919876543210",
  "verdict": "High risk",
  "score": 0.85,
  "reasons": ["Reported 14 times", "Not in official number list for Zomato"],
  "reportCount": 14,
  "brand": "Zomato",
  "officialNumber": null,
  "detailUrl": "https://example.com/number/+919876543210"
}
```

| Field | Type | Description |
|---|---|---|
| `number` | string | Normalised number (+91 format) |
| `verdict` | string | One of: `"Verified official"`, `"High risk"`, `"Suspicious"`, `"Unknown"` |
| `score` | number | Risk score 0–1 (higher = more risky) |
| `reasons` | string[] | Human-readable list of reasons for the verdict |
| `reportCount` | number | Number of times this number has been reported |
| `brand` | string \| null | Brand matched, if any |
| `officialNumber` | string \| null | The official care number for that brand, if known |
| `detailUrl` | string | URL of this number's detail page on the website |

---

### `POST /report`

Flag a phone number as a suspected scam.

**Request body**
```json
{
  "number": "+919876543210",
  "brand": "Zomato",
  "note": "Called claiming to be Zomato support and asked for OTP"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `number` | string | yes | Phone number to report |
| `brand` | string | no | Brand the caller claimed to represent |
| `note` | string | no | Free-text description of the incident |

**Response**
```json
{
  "ok": true,
  "reportCount": 15
}
```

| Field | Type | Description |
|---|---|---|
| `ok` | boolean | `true` if the report was saved |
| `reportCount` | number | Updated total report count for this number |

---

### `GET /number/:n`

Get the check result plus a summary of all reports for a number.

**URL parameter:** `:n` — the phone number (URL-encoded)

**Response**
```json
{
  "number": "+919876543210",
  "verdict": "High risk",
  "score": 0.85,
  "reasons": ["Reported 14 times", "Not in official number list for Zomato"],
  "reportCount": 14,
  "brand": "Zomato",
  "officialNumber": null,
  "detailUrl": "https://example.com/number/+919876543210",
  "reports": [
    { "note": "Asked for OTP", "createdAt": "2026-10-07T10:00:00Z" }
  ]
}
```

Same fields as `POST /check`, plus:

| Field | Type | Description |
|---|---|---|
| `reports` | object[] | Array of report summaries for this number |
| `reports[].note` | string | The note left with the report |
| `reports[].createdAt` | string | ISO 8601 timestamp |

---

### `GET /brand/:name`

Get the official care number(s) and related info for a brand.

**URL parameter:** `:name` — brand name or alias (URL-encoded)

**Response**
```json
{
  "brand": "Zomato",
  "officialNumbers": ["+918069696969"],
  "sourceUrl": "https://www.zomato.com/contact",
  "lastChecked": "2026-10-01",
  "knownFakeNumbers": []
}
```

| Field | Type | Description |
|---|---|---|
| `brand` | string | Canonical brand name |
| `officialNumbers` | string[] | Official customer care numbers from the brand's own site |
| `sourceUrl` | string | URL where the numbers were verified |
| `lastChecked` | string | Date last verified (YYYY-MM-DD) |
| `knownFakeNumbers` | string[] | Numbers flagged as fake for this brand |

---

### `GET /stats`

Get aggregate statistics and recent activity for the dashboard.

**Response**
```json
{
  "totals": {
    "checks": 342,
    "reports": 87,
    "brands": 18
  },
  "recentChecks": [
    { "number": "+919876543210", "verdict": "High risk", "createdAt": "2026-10-08T09:00:00Z" }
  ],
  "recentReports": [
    { "number": "+919876543210", "brand": "Zomato", "createdAt": "2026-10-08T09:05:00Z" }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `totals` | object | Aggregate counts |
| `totals.checks` | number | Total number checks ever run |
| `totals.reports` | number | Total reports submitted |
| `totals.brands` | number | Number of brands in the database |
| `recentChecks` | object[] | Most recent checks (implementation decides how many) |
| `recentReports` | object[] | Most recent reports (implementation decides how many) |
