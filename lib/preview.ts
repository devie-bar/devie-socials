// Local design preview only: `DV_PREVIEW=1 next dev` renders every screen with
// sample data and no sign-in, so layouts can be checked at 390/834/1440.
// It can never switch on in a production build.
export const PREVIEW = process.env.NODE_ENV === "development" && process.env.DV_PREVIEW === "1";
