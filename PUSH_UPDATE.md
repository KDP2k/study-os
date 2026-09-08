# Push this design update

This build is designed to be copied over your existing `KDP2k/study-os` working folder. It does not include `.git`, `.env.local`, `node_modules`, `.next`, or a generated lockfile.

## Safest update path on Windows

1. Keep your existing repo folder and `.env.local` exactly where they are.
2. Extract this ZIP somewhere temporary.
3. Copy the extracted project contents into your existing `study-os` repo folder and allow Windows to replace matching files.
4. Do **not** delete your existing `.env.local`.
5. From the existing repo folder run:

```cmd
npm install
npm run build
```

6. If the build succeeds:

```cmd
git status
git add .
git commit -m "Refresh Study OS engineering console UI"
git push
```

Vercel will deploy automatically from `main`.

## Course artwork

Replace `public/course-art/image_1.jpg` through `image_8.jpg` with your own images and keep the same filenames. Recommended size is 1600x900.
