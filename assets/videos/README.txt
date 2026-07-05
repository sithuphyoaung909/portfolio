Place your local videos in this folder.

Example:
assets/videos/soom-mite-01.mp4
assets/videos/safer-everyday-01.mp4

To use local MP4 files, update a media item in campaignData as:
{ type: "video", src: "assets/videos/soom-mite-01.mp4", local: true }

Then update openVideo() logic in index.html to render a <video> tag for local files.