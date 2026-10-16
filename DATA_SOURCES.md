# Data sources

Everything on screen, where it comes from, and how far to trust it.

| What | Source | Licence | Live? |
| --- | --- | --- | --- |
| Every listing: type, price, bedrooms, bathrooms, floor area, year built | **Fictional.** Drawn by `scripts/make-listings.mjs` from a seeded random generator inside plausible ranges per type | — (made up) | No |
| Where each listing sits, and its community and sector | one point inside each of 25 residential districts of **The City of Calgary, Community District Boundaries** ([Open Calgary](https://data.calgary.ca/Base-Maps/Community-District-Boundaries/surr-xmvs)) | Open Government Licence – City of Calgary | No: when the script ran |
| Commute times and distances | Unmap Matrix API, on the OpenStreetMap road network | ODbL, © OpenStreetMap contributors | Live |
| 15 and 30-minute areas | Unmap Isochrone API | ODbL, © OpenStreetMap contributors | Live |
| Nearby groceries, schools, parks, pharmacies, coffee | Unmap Places (geocoding `nearby`) | per source, see unmap.dev/attribution | Live |
| Destination search | Unmap Geocoding API | per source, see unmap.dev/attribution | Live |
| Basemap | Unmap Maps API: OpenStreetMap | ODbL, © OpenStreetMap contributors | Live |

## The listings

No listing is real, for sale, or scraped, and none has a street address. The point of placing
them in real communities is that everything the app asks Unmap about them is real: the road
network to your office, the areas within reach, the shops and schools around. The script picks
residential districts the city marks as established, developing or complete, spreads them over
the city's eight sectors, and places each listing at a point inside the district (its centroid
when that is inside, else the first inside point found). The generator is seeded, so the file is
the same every time it runs.

Attribution for the district boundaries, as shown in the app under the list:

> Contains information licensed under the Open Government Licence – City of Calgary.

The licence and what was taken from the city are in [`data/LICENSE-DATA.md`](data/LICENSE-DATA.md).
