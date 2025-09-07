# TODO - Image Upload and Display Fix for Auctions

## Backend
- [ ] Add multer middleware in backend/server.js to handle multipart/form-data uploads.
- [ ] Update createAuction controller in backend/controllers/auctionController.js to process uploaded image files, save them (locally or cloud), and store their URLs/paths in the auction document.

## Frontend
- [ ] Modify CreateAuction.jsx to submit images as FormData including actual files.
- [ ] Update AuctionDetail.jsx to display auction images visually in the product details page.

## Testing
- [ ] Test full image upload flow from frontend to backend.
- [ ] Verify images display correctly on auction details page.
- [ ] Test edge cases such as no images, multiple images, invalid files.
