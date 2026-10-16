# Features

What Property Explorer does, which Unmap API does it, and what it deliberately does not do (spec §7).

## Implemented

| Feature | How | Unmap |
| --- | --- | --- |
| Map | registry `map`, `base` style, light or dark with the page, labels in English or French | Maps API |
| 25 fictional listings | `data/listings.sample.json`, made by `scripts/make-listings.mjs`, validated on load; labelled "Fictional" on every card, the details and the notice | — |
| Listings on the map | a price tag per listing (registry `marker-popup`); the chosen one filled, compared ones outlined | — |
| Filters | price ceiling, bedrooms, type (several at once) and area (the city's sector), in the browser | — |
| Select through map or list | a tag or a card opens the listing; the camera eases to it | — |
| Destination | registry `geocoder`; the app opens on a sample destination (downtown Calgary), labelled as a sample | Geocoding (`/geocode/autocomplete`) |
| Commute times | driving or walking, from every listing, 10 per call, sorted quickest first; kept per destination and mode | Routing (`/matrix`) |
| Commute unavailable | a missing matrix answer is shown as "Commute unavailable", never estimated; left out while filtering by time, with a count | Routing |
| Travel-time areas | 15 and 30 minutes around the destination, in one call; the chosen one stronger (registry `geojson-layer`) | Routing (`/isochrone`) |
| Filter by reachable area | "Only listings within 15/30 min", by the matrix time | — |
| Nearby amenities | groceries, schools, parks, pharmacies and coffee within 1.5 km of an opened listing, the nearest three of each, in one call | Places (`/geocode/nearby`) |
| Compare two | tick two listings; price, type, bedrooms, bathrooms, floor area, year, community and commute side by side | — |
| Errors | every API failure shown where its answer would have been, in en/fr, with a retry when waiting could help | — |
| English and French | the header switch; map labels, place search and nearby names follow | Maps, Geocoding `lang` |
| No-key state | the listings still list and filter; the map pane explains how to get a key; the API is never called without one | — |
| Built with Unmap | the services, calls, components and data sources behind the page | — |

## Not goals

Real listings or MLS data, mortgage or affordability maths, saved searches, transit commutes,
school catchments or ratings, and price history (spec §7). The listings are fictional and the
app never says otherwise.
