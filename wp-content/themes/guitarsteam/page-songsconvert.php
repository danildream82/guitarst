<?php
/*
 * Template Name: Songs Converter
 *
 * Created by Eugene
 * Date: 26.02.2018
 */

include_once "inc/songscp.php";

$error = [];
$request = [];
$successMessage = '';

if (isset($_REQUEST['action']) && $_REQUEST['action'] == 'convertSong') {

    try {
        $globalConvertResult = SongsCP::convertSongsRecursive(SongsCP::DEFAULT_SONG_FILES_DIR);
        if(!empty($globalConvertResult->error)) {
            throw new \Exception('Local Convert Upload error: ' . $globalConvertResult->error);
        }
    } catch(Exception $e) {
        $errors = $e->getMessage();
    }   

    $successMessage = "Converted: <br />". implode("<br />", $globalConvertResult->result);
}

get_header();
?>
<html>
<head>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
</head>
<body>
<div style="padding-left:300px;">
    
    <!-- Start: Errors Block //-->
    <span style="color:red;font-weight:bold;"><?=$errors; ?></span>
    <!-- Finish: Errors Block //-->

    <!-- Start: Success Block //-->
    <span style="color:yellow;font-weight:bold;font-weight:14px;"><?=$successMessage; ?></span>
    <!-- Finish: Success Block //-->
    
<form method="post" enctype="multipart/form-data">
    <input type="hidden" name="action" value="convertSong">
    <input type="submit" name="GLOBAL COVERT" value="GLOBAL COVERT">
</body>
</html>
<?php
get_footer();
?>
