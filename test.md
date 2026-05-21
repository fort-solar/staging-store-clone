# Fortsolar Web App Test Plan

## 1. Objective

The objective of this test plan is to verify that the Fortsolar web application works correctly across its major user flows, including authentication, customer dashboard, installer dashboard, admin dashboard, product catalog, cart, checkout, payments, uploads, notifications, and profile management.

Testing will be divided into:

- Unit Testing
- End-to-End Testing

---

# 2. Unit Testing Checklist

## 2.1 Authentication

- [ ] Login form validates required email and password fields
- [ ] Invalid email format shows validation error
- [ ] Password field handles empty input correctly
- [ ] Login API function sends correct payload
- [ ] Register form validates required fields
- [ ] Register API function sends correct payload
- [ ] Logout function clears user session/token state
- [ ] Auth state updates correctly after successful login
- [ ] Protected route logic redirects unauthenticated users
- [ ] Role-based route logic separates customer, installer, and admin access

---

## 2.2 Customer Dashboard

- [ ] Customer summary API handler returns expected data format
- [ ] Quotes list component renders empty state correctly
- [ ] Orders list component renders order cards/table correctly
- [ ] Installation list component renders installation status correctly
- [ ] Customer profile update form validates fields correctly
- [ ] Cart state updates when an item is added
- [ ] Cart state updates when quantity changes
- [ ] Cart state updates when an item is removed
- [ ] Favorites toggle updates local/UI state correctly

---

## 2.3 Products and Packages

- [ ] Product list component renders panels, inverters, and batteries correctly
- [ ] Package list component renders available solar packages
- [ ] Product detail page handles valid product ID/slug
- [ ] Product detail page handles invalid or missing product
- [ ] Product filters/search return expected filtered results
- [ ] Product price formatting works correctly
- [ ] Product image fallback works when image is missing

---

## 2.4 Calculator

- [ ] Calculator form validates required appliance input
- [ ] Appliance quantity input accepts valid numbers only
- [ ] Calculator API function sends correct payload
- [ ] Calculator result component displays system size correctly
- [ ] Calculator result handles empty/error response correctly
- [ ] Calculate-from-totals logic sends correct pre-aggregated data

---

## 2.5 Orders and Checkout

- [ ] Checkout form validates customer details
- [ ] Checkout prevents submission with empty cart
- [ ] Order creation API function sends correct cart/order payload
- [ ] Order summary calculates subtotal correctly
- [ ] Order summary calculates total correctly
- [ ] Order detail component renders items, timeline, shipping, and payment status
- [ ] Payment initialization function sends correct order ID
- [ ] Payment verification function sends correct reference

---

## 2.6 Installer Dashboard

- [ ] Installer job list renders available jobs
- [ ] Installer job detail renders job information correctly
- [ ] Apply-to-job function sends correct job ID
- [ ] Save-job function updates saved state
- [ ] Remove-saved-job function updates saved state
- [ ] Installer onboarding form validates required fields
- [ ] Installer profile update sends correct payload
- [ ] Installer payout method form validates bank details
- [ ] Installer project list renders assigned projects

---

## 2.7 Admin Dashboard

- [ ] Admin stats component renders KPI cards correctly
- [ ] Admin customer list renders users correctly
- [ ] Admin installer list renders installers correctly
- [ ] Admin order list renders orders correctly
- [ ] Admin quote request list renders quotes correctly
- [ ] Admin product creation form validates fields
- [ ] Admin product update form validates optional fields
- [ ] Admin delete action shows confirmation before deleting
- [ ] Admin role/permission logic hides restricted actions
- [ ] Admin activity log renders audit entries correctly

---

## 2.8 Uploads and Media

- [ ] Upload form accepts valid image/file types
- [ ] Upload form rejects invalid file types
- [ ] Upload function sends multipart/form-data correctly
- [ ] Upload progress/loading state displays correctly
- [ ] Uploaded media preview renders correctly
- [ ] Delete upload function removes media from UI state

---

## 2.9 Notifications

- [ ] Notification list renders unread and read notifications
- [ ] Mark-as-read function updates notification state
- [ ] Empty notification state displays correctly
- [ ] Realtime notification handler updates UI when new notification arrives

---

## 2.10 Error and Loading States

- [ ] API loading state displays spinner/skeleton
- [ ] API error state displays readable message
- [ ] Empty state displays friendly message
- [ ] Retry button re-fetches failed request
- [ ] Network error is handled gracefully
- [ ] Unauthorized API response redirects user to login

---

# 3. End-to-End Testing Checklist

## 3.1 Authentication Flow

- [ ] User can register successfully
- [ ] User can login successfully
- [ ] User can view current profile/session
- [ ] User can update profile
- [ ] User can request email verification
- [ ] User can verify email using token/link
- [ ] User can request password reset
- [ ] User can reset password
- [ ] User can logout successfully
- [ ] User cannot access protected pages after logout

---

## 3.2 Customer Product and Checkout Flow

- [ ] Customer can browse product catalog
- [ ] Customer can view product details
- [ ] Customer can add product to cart
- [ ] Customer can update product quantity in cart
- [ ] Customer can remove product from cart
- [ ] Customer can proceed to checkout
- [ ] Customer can create an order
- [ ] Customer can initialize Paystack payment
- [ ] Customer can complete payment using inline checkout
- [ ] Customer can verify payment after payment callback
- [ ] Customer can see successful order status
- [ ] Customer can view order details from dashboard

---

## 3.3 Customer Quote Flow

- [ ] Customer can open quote request form
- [ ] Customer can select appliances
- [ ] Customer can submit quote request
- [ ] Customer can see submitted quote in dashboard
- [ ] Admin can view submitted quote
- [ ] Admin can update quote status
- [ ] Customer can see updated quote status

---

## 3.4 Customer Installation Flow

- [ ] Customer can view installations
- [ ] Customer can open installation detail
- [ ] Customer can view installation proof photos
- [ ] Customer can approve completed installation
- [ ] Customer can report an issue with installation
- [ ] Reported issue appears correctly for admin/team review

---

## 3.5 Installer Onboarding Flow

- [ ] Installer can register/login
- [ ] Installer can submit onboarding profile
- [ ] Installer can upload required verification documents
- [ ] Installer can view onboarding status
- [ ] Admin can view installer verification submission
- [ ] Admin can approve installer verification
- [ ] Admin can reject installer verification with note
- [ ] Installer can see approval/rejection status

---

## 3.6 Installer Job Flow

- [ ] Installer can view open jobs
- [ ] Installer can view job details
- [ ] Installer can apply for job
- [ ] Installer can save/bookmark job
- [ ] Installer can remove saved job
- [ ] Admin can view job applicants
- [ ] Admin can accept/reject applicant
- [ ] Installer can see assigned project/job
- [ ] Installer can mark job as in progress
- [ ] Installer can report issue on job

---

## 3.7 Admin Management Flow

- [ ] Admin can login successfully
- [ ] Admin can view dashboard KPIs
- [ ] Admin can view customers
- [ ] Admin can create customer
- [ ] Admin can update customer
- [ ] Admin can delete customer
- [ ] Admin can view installers
- [ ] Admin can update installer profile/status
- [ ] Admin can create staff admin
- [ ] Admin can assign admin role/permissions
- [ ] Restricted admin cannot access super admin actions

---

## 3.8 Admin Product Management Flow

- [ ] Admin can create product category
- [ ] Admin can create solar panel product
- [ ] Admin can create inverter product
- [ ] Admin can create battery product
- [ ] Admin can upload product image
- [ ] Admin can edit product
- [ ] Admin can delete product
- [ ] Deleted product no longer appears in public catalog
- [ ] Public user can view published products

---

## 3.9 Admin Package Management Flow

- [ ] Admin can create product package
- [ ] Admin can upload package image
- [ ] Admin can edit package
- [ ] Admin can delete package
- [ ] Public user can view product packages
- [ ] Customer can request package/bundle
- [ ] Admin can approve/reject bundle request

---

## 3.10 Admin Order and Transaction Flow

- [ ] Admin can view all orders
- [ ] Admin can create order manually
- [ ] Admin can update order status
- [ ] Admin can approve paid store order
- [ ] Admin can view transactions
- [ ] Admin can create transaction record
- [ ] Admin can update transaction status
- [ ] Completed payment updates related order status correctly

---

## 3.11 Blog and SEO Pages Flow

- [ ] Admin can create blog post
- [ ] Admin can upload blog image
- [ ] Admin can edit blog post
- [ ] Admin can delete blog post
- [ ] Public user can view published blog list
- [ ] Public user can view blog post by slug
- [ ] Admin can create SEO site page
- [ ] Public user can view published SEO site page by slug

---

## 3.12 Upload and Download Flow

- [ ] User can upload file successfully
- [ ] User can view upload metadata
- [ ] Authorized user can download uploaded file
- [ ] Unauthorized user cannot download protected file
- [ ] Admin with permission can access R2-backed media
- [ ] User can delete own upload

---

## 3.13 Notification Flow

- [ ] User receives notification after important action
- [ ] Customer can view notifications
- [ ] Installer can view notifications
- [ ] Admin can view notifications
- [ ] User can mark notification as read
- [ ] Realtime Socket.IO notification updates UI without refresh

---

# 4. Test Environments

- [ ] Local development environment
- [ ] Staging environment
- [ ] Production environment

---

# 5. Browsers and Devices

## Desktop

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Mobile

- [ ] Android Chrome
- [ ] iOS Safari

## Responsiveness

- [ ] Mobile screens
- [ ] Tablet screens
- [ ] Desktop screens
- [ ] Large desktop screens

---

# 6. General UI/UX Testing

- [ ] Pages load without layout break
- [ ] Buttons have loading states
- [ ] Forms show validation messages
- [ ] Success messages are clear
- [ ] Error messages are clear
- [ ] Empty states are handled
- [ ] Tables are responsive
- [ ] Modals open and close correctly
- [ ] Dropdowns work correctly
- [ ] Pagination works correctly
- [ ] Search and filters work correctly

---

# 7. Security and Permission Testing

- [ ] Unauthenticated users cannot access protected routes
- [ ] Customer cannot access admin routes
- [ ] Customer cannot access installer routes
- [ ] Installer cannot access admin routes
- [ ] Admin permissions restrict unauthorized actions
- [ ] Expired token redirects user to login or refreshes session
- [ ] Logout invalidates session
- [ ] Protected file downloads require authorization
- [ ] Payment verification cannot be faked from frontend only

---

# 8. Final Sign-off Checklist

- [ ] All critical unit tests passed
- [ ] All critical end-to-end tests passed
- [ ] Authentication flows tested
- [ ] Customer flows tested
- [ ] Installer flows tested
- [ ] Admin flows tested
- [ ] Payment flow tested
- [ ] Upload flow tested
- [ ] Notification flow tested
- [ ] Mobile responsiveness tested
- [ ] Browser compatibility tested
- [ ] Known issues documented
- [ ] Project manager approval received

---

# 9. Notes / Issues Found

| Date | Module | Issue | Severity | Assigned To | Status |
| ---- | ------ | ----- | -------- | ----------- | ------ |
|      |        |       |          |             |        |
|      |        |       |          |             |        |
|      |        |       |          |             |        |