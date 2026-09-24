# Salon TV V1

Salon TV is a silent, barber-controlled display mode for BarBerBe.

## Product rules

- The barber's phone is the only controller.
- The TV is display-only.
- Pairing is one-controller-at-a-time.
- The pairing code is visible only before the first connection.
- The display never plays BarBerBe audio.
- Client content automatically falls back to idle after 2 minutes.
- Product spotlights automatically fall back to idle after 3 minutes.
- The paired display stays valid for 30 days unless the barber resets it.
- Client images are never pushed to the TV automatically. The barber must tap "show client".

## Display modes

### idle
Salon branding plus up to four active salon products.

### client
Before/after client result, selected look title, optional client name, and favorite marker.

### product
One salon product with name, optional image, price and short sales note.

## Product inventory

Salon products are separate from generic recommendation categories.

A salon product can contain:

- name
- price
- image URL
- category link
- active state
- short note

The controller stores the salon's current inventory locally on the barber device in V1.
The recommendation engine uses the linked category to prioritize products that fit the selected look.

## TV routes

- Display: `/barber/tv`
- Create/read display session: `/api/barber/tv/session`
- Claim display: `/api/barber/tv/claim`
- Update display: `/api/barber/tv/update`
- Reset display: `/api/barber/tv/reset`

## Sync backend

Salon TV uses a dedicated **private Vercel Blob store** connected only to the BarBerBe Vercel project.

Required environment variable, normally injected automatically when the Blob store is connected:

```
BLOB_READ_WRITE_TOKEN=
```

Session state is stored as small private JSON blobs under:

```
barberbe-tv/sessions/<6-digit-code>.json
```

The browser never receives the Blob read/write token. All Blob reads and writes happen through the BarBerBe server API.

Pairing writes use the Blob ETag as a conditional write guard, so one display cannot be claimed by two controller phones at the same time.

Street Vibe and Vesti Beauty storage must remain completely separate from BarBerBe.

## Music-friendly behavior

Salon TV is visual-only.

- no audio elements
- skin videos are muted
- no sound effects
- no automatic takeover of salon audio

On TVs that support Multi View, the salon can keep YouTube/Spotify or another audio source active alongside the BarBerBe display.
On TVs without Multi View, BarBerBe does not attempt to control or replace the salon's music source.
