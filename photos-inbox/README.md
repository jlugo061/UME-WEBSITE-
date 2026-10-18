# Photo inbox

Add new work photos here and the site updates itself.

1. On github.com, open the folder for the photo's category:
   `helm` (finished helms) · `blackout` (black panels) · `fab` (fabrication in progress) · `wiring` · `radar` (radar, cameras, antennas, Starlink) · `av` (audio & TVs) · `boats` · `shop` (the crew at work)
2. Click **Add file → Upload files**, drop the photos in (iPhone HEIC is fine), and commit.
3. Within a few minutes a pull request called **"New gallery photos"** appears. It has resized every photo, removed location data and added them to the gallery.
4. Open the pull request's Netlify preview link, check the photos, and click **Merge**. They're live.

Optional caption: upload a text file with the same name as the photo (for example `IMG_1234.txt`) containing one short line, like `Intrepid 407 · triple Garmin`.

**One-time setup:** in the repo's Settings → Actions → General → Workflow permissions, tick **"Allow GitHub Actions to create and approve pull requests"** and save. Without it the Action can resize the photos but can't open the pull request.
