// GridTwin ZA — local configuration
//
// This file holds API keys so that index.html can be replaced at any time
// without disturbing them. Upload it once; later index.html updates just work.
//
// ── Google Solar API (optional) ───────────────────────────────────────────────
// Powers the rooftop calculator's per-segment roof orientation: Google returns
// each roof face with its own pitch and compass direction, which the single
// "Roof orientation" dropdown cannot represent.
//
// Leave this blank and the feature simply stays off — the manual roof tracer and
// the dropdown continue to work exactly as before.
//
// A browser API key is ALWAYS visible in page source; that is unavoidable for a
// static site and is why Google's protection model is referrer restrictions
// rather than secrecy. Before using a key here, restrict it in the Google Cloud
// console:
//
//   APIs & Services → Credentials → your key
//     Application restrictions → Websites → nickhedley.github.io/*
//     API restrictions        → Restrict key → Solar API only
//
// Also set a daily quota (APIs & Services → Solar API → Quotas → Requests per
// day). Google applies no spending cap by default, so the quota is the backstop.
//
// GitHub's secret scanner may flag this file. That alert is expected: the key is
// intentionally public and protected by the restrictions above. Rotate the key
// (create a new one, restrict it, delete the old one) if it was ever exposed
// without restrictions in place.

window.GOOGLE_SOLAR_KEY = 'AIzaSyDdK8pxmVjZ2qZiLkfGrv7AXuQZuDe5J2o';
