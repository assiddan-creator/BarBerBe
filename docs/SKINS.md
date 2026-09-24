# BarBerBe V2 Skin System

BarBerBe V2 separates product logic from visual identity.

The core flow stays the same:

1. Upload a photo
2. Choose personal or barber mode
3. Choose a hairstyle / beard direction
4. Generate with Nano Banana 2
5. Compare, download and share

A **skin** controls the visual experience around that flow.

## What a skin can replace

Each skin can define:

- Brand name
- Tagline
- Optional logo
- Primary and secondary colors
- Background and surface colors
- Border and radius tokens
- Hero copy
- Home media
- Style-picker media
- Generation/loading media
- Result-screen media

Media slots support:

- Video
- Image
- No media

Video slots support:

- source file
- poster image
- object position
- overlay

## Files

Skin registry:

`lib/barber-skins.ts`

Reusable media renderer:

`components/barber/SkinBackdrop.tsx`

Skin CSS variables are applied for every route under:

`app/barber/layout.tsx`

## Selecting a skin

Each deployment can select a skin with:

`NEXT_PUBLIC_BARBERBE_SKIN=<skin-id>`

Example:

`NEXT_PUBLIC_BARBERBE_SKIN=barberbe-core`

This makes it possible to deploy the same application for different salons
without duplicating product logic.

## Adding a client skin

1. Add a new entry to `BARBER_SKINS`.
2. Give it a unique id.
3. Set brand, theme and copy.
4. Put client media in a dedicated folder such as:
   `public/skins/<client-id>/`
5. Point the four media slots at those files.
6. Set `NEXT_PUBLIC_BARBERBE_SKIN` for that deployment.

Do not fork the AI routes or style-selection logic just to change appearance.

## Media strategy

The UI should not assume every screen needs video.

Recommended rule:

- Home: cinematic video when it adds brand feeling.
- Style picker: calmer video or still image so choices remain readable.
- Generating: looped motion asset works well because the user is waiting.
- Result: keep media subtle. The generated user image must remain the hero.

Buttons, accessibility controls, upload controls and critical text remain real UI
elements above the media layer.

## Future multi-tenant option

Today the skin is selected per deployment.

If BarBerBe later becomes a multi-tenant SaaS product, the same `BarberSkin`
schema can be loaded from a database by tenant/domain instead of the environment
variable. The product flow does not need to change.
