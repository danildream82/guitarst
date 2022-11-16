<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', '');

/** MySQL database username */
define('DB_USER', '');

/** MySQL database password */
define('DB_PASSWORD', '');

/** MySQL hostname */
define('DB_HOST', 'localhost');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8mb4');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         'j7kyR,d:;iMhWX2m_6)B>1z!,W}/--wUXoZl&Qlfdj3g_]4KSDckFsi>HJ8C[YO]');
define('SECURE_AUTH_KEY',  '7)?l?O2TR!_FLZ3dqXM9rsAaWx<=501,=>+jtYVt/Y$[||ql|BjCIPX:lBQv}ITG');
define('LOGGED_IN_KEY',    't><nYtI;]t(M3>_-&PN4ZDB1wKX1@VOj[ufaenl=bAQ=U=:5TL2Zb]W?rk:-o86E');
define('NONCE_KEY',        'X&ur@4f&MS({%X]6!wRbFK*XRJTPE.Cpgq<B8>|7rym+?El>Yx`KDaG{@1MCd%N`');
define('AUTH_SALT',        'o6|:SpXvYN[/dP-,E7,<fa!?iyR?gD5h@b8wX[d0DLq*q%Q Q2I$/[>Ndp _5os{');
define('SECURE_AUTH_SALT', '7(S$cvd yUjX?DVtl1IG&BGynP1:b<(srQd*g/#hPAtJ:`:/YID^Q|s9>O=n 1D3');
define('LOGGED_IN_SALT',   '~Q<*^|00pcUfMnisx*S_0sRY;;0$^C?jV=s&Mu Zex>pe7@rl]G5Ny0-54=Cy$,]');
define('NONCE_SALT',       'l,1n53i&[^O;/!Ay}`vrF<Vg$TMfO1:b<6{%8cvlV8[:(),!HNcY^iw9ub b3r{W');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'gp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define('WP_DEBUG', false);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');

@ini_set('display_errors', 1);
