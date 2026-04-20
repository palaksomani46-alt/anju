# Security Specification for Strictch Toppers

## Data Invariants
1. A user profile must correctly store the UID from the authentication object.
2. Only the user with email 'somanimayank723@gmail.com' can have the 'admin' role.
3. Enrollments must link to a valid course and a valid user.
4. Users can only see their own enrollments, while admins can see all.
5. Once an enrollment is 'approved' or 'rejected', it cannot be modified by the student.

## The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Spoofing**: Attempt to create a user profile with a different UID than `request.auth.uid`.
2. **Privilege Escalation**: Attempt to set `role: 'admin'` as a regular student during signup.
3. **Invalid Email Signup**: Attempt to create a profile for 'not-admin@example.com' with `role: 'admin'`.
4. **Course Price Hijack**: Regular user attempting to create or edit a course price.
5. **Orphaned Enrollment**: Attempt to create an enrollment with a non-existent `courseId`.
6. **Enrollment Forging**: Student attempting to change their own enrollment status from `pending` to `approved`.
7. **Cross-User Leak**: User A trying to read enrollment of User B.
8. **Malicious ID Injection**: Creating a course with an ID that is 1MB of junk characters.
9. **Shadow Field Injection**: Adding `isVerified: true` to a user profile to bypass future checks.
10. **Timestamp Modification**: User providing a `createdAt` date in the past instead of `request.time`.
11. **Enrollment Overwrite**: Malicious user trying to delete another user's payment screenshot.
12. **Admin Lockdown**: Attempting to update the `role` field on an existing admin profile to lock them out.

## Test Strategy
- Verify `isValidUser`, `isValidCourse`, `isValidEnrollment` on all writes.
- Enforce `affectedKeys().hasOnly()` for all state transitions.
- Use `get()` to verify admin status dynamically.
