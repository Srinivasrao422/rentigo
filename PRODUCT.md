# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Renters browse cars, motorcycles, scooters, and other vehicles. They compare rental rates, check availability for their dates, submit a booking request, and track its status.
- Rental agency owners manage listings, block vehicles for maintenance, and review incoming booking requests.
- Administrators review vehicle listings and manage users and agencies.

Audience priority is open. These roles and jobs come from the repository rather than from user interviews.

## Product Purpose

RentiGo supports daily, weekly, and monthly vehicle rentals from discovery through an agency-reviewed booking request. Renters can see whether a vehicle is available and what the rental will cost. Agencies can use the same system to manage reservations, fleet availability, and maintenance.

## Positioning

The booking service checks the requested dates against existing reservations and scheduled maintenance. The quote engine compares daily, weekly, and monthly pricing tiers and applies the lowest applicable rental price.

## Operating Context

- The public catalog supports browsing and filtering by vehicle attributes, location, and daily price. Date availability and the itemized quote are checked on the vehicle detail page.
- A signed-in renter submits a booking request. The request starts pending, and the renter can follow its status in My Bookings.
- Agencies and administrators use separate dashboards. Agencies manage the fleet and booking requests, while administrators oversee listing approval and platform records.

## Capabilities and Constraints

- Quotes display the rental duration, rate, applicable savings, tax, refundable security deposit, and total.
- Only approved, available vehicles can be booked. Existing pending, approved, and active bookings and applicable maintenance blocks are considered when checking for conflicts.
- Preserve the distinction between a booking request and a confirmed reservation in customer-facing language.

## Brand Commitments

The existing product name is **RentiGo**.

## Evidence on Hand

- `README.md` describes the product, roles, pricing rules, and local demo.
- `backend/prisma/seed.ts` and `backend/src/config/devStore.ts` provide demo data. Demo records do not establish real customers, inventory, or market coverage.
- `frontend/src/app` contains the public catalog, renter booking history, and role-specific dashboards.

## Product Principles

These principles are inferred from the implementation and remain open to confirmation.

- Make availability specific to the renter’s dates.
- Show how the rental total is calculated and identify the refundable deposit.
- Keep the booking status clear from submission through the agency’s decision.
- Reflect maintenance and existing reservations in the availability renters see.
