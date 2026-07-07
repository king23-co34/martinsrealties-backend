const { body } = require('express-validator');

// IMPORTANT: normalizeEmail() with its default options rewrites Gmail
// addresses (strips dots, strips "+subaddress", lowercases), e.g.
// "John.Doe+admin@gmail.com" becomes "johndoe@gmail.com". The admin
// seed process (ensureAdminSeeded.js) only lowercases/trims — it does
// NOT strip dots or +subaddress tags. If those two normalizations ever
// disagree, a perfectly correct password will still fail login with
// "Invalid email or password" because the email lookup misses.
// Disabling the Gmail-specific rewrites here keeps normalization
// consistent (simple lowercase + trim) everywhere in the app.
const emailNormalizeOptions = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  gmail_convert_googlemaildotcom: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false,
};

exports.registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(emailNormalizeOptions),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('phone').optional().trim(),
];

exports.loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(emailNormalizeOptions),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.updatePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
];
