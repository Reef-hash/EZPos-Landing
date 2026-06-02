# Licensing API V1 Contract Matrix

Purpose: frozen contract baseline for centralized licensing flows and migration adapters.
Scope: EZPos-Web backend licensing namespace for EZPos-System, CrossxPos, and future products.

## API Versioning
- Base path: /api/v1/licensing
- Compatibility path (temporary): /api/licenses/*
- Migration rule: legacy clients may consume compatibility endpoints until cutover date is approved.

## Required Endpoints
- POST /api/v1/licensing/activate (implemented baseline)
- POST /api/v1/licensing/validate (implemented baseline)
- POST /api/v1/licensing/deactivate
- POST /api/v1/licensing/transfers/request
- POST /api/v1/licensing/transfers/confirm
- GET  /api/v1/licensing/entitlements/:id

Implementation status notes:
- Current activate endpoint returns validation decision + baseline activation payload.
- Activation persistence (activations table write) is planned in next iteration.

## Decision Model
- allow: operation accepted, client continues normal runtime.
- deny: operation rejected, client blocks protected workflow.
- allow_temporarily: operation accepted via policy grace; client must revalidate within policy hint.

## Status and Reason Code Matrix

| status | decision | reason_code | client_action |
|---|---|---|---|
| valid | allow | VALID | continue |
| expired | deny | ENTITLEMENT_EXPIRED | renew_subscription |
| revoked | deny | ENTITLEMENT_REVOKED | contact_support |
| product_mismatch | deny | PRODUCT_MISMATCH | use_correct_product_license |
| seat_exceeded | deny | SEAT_LIMIT_EXCEEDED | release_other_device_or_upgrade |
| device_mismatch | deny | DEVICE_MISMATCH | request_transfer |
| not_found | deny | LICENSE_NOT_FOUND | check_key_or_contact_support |
| grace_allowed | allow_temporarily | OFFLINE_GRACE_ACTIVE | continue_and_revalidate |

## Standard Response Shape

```json
{
  "valid": true,
  "decision": "allow",
  "status": "valid",
  "reason_code": "VALID",
  "client_action": "continue",
  "product": "ezpos",
  "plan": "Standard",
  "expiresAt": "2027-06-01T00:00:00.000Z",
  "customerName": "Acme Store",
  "expired": false,
  "expectedProduct": "ezpos",
  "policy": {
    "graceDays": 7,
    "revalidateAfterHours": 24
  },
  "error": null
}
```

## Policy Hint Baseline
- EZPos: graceDays=7, revalidateAfterHours=24, strict device binding, seat=1.
- CrossxPos: graceDays=1-3, revalidateAfterHours=12, flexible binding, configurable seats.

## Legacy Compatibility Mapping

Current compatibility endpoint:
- POST /api/licenses/validate

Legacy request (EZPos-System):
```json
{
  "LicenseKey": "EZP-STD-XXXX-XXXX-XXXX",
  "DeviceId": "DEVICE-FINGERPRINT",
  "Product": "ezpos"
}
```

Compatibility response:
```json
{
  "IsValid": true,
  "IsOffline": false,
  "Message": "License is valid.",
  "Decision": "allow",
  "Status": "valid",
  "ReasonCode": "VALID",
  "ClientAction": "continue",
  "Product": "ezpos",
  "Plan": "Standard",
  "ExpiresAt": "2027-06-01T00:00:00.000Z",
  "Policy": {
    "graceDays": 7,
    "revalidateAfterHours": 24
  }
}
```

Mapping rules:
- IsValid = (decision == allow || decision == allow_temporarily)
- IsOffline is controlled by client transport layer and network errors, not entitlement status.
- Message uses error when present; otherwise uses generic success text.

## Migration Guardrails
- New client code must prefer /api/v1/licensing/*.
- Legacy adapter remains until cutover date is approved.
- Any new status must define reason_code and client_action before release.
