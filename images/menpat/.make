#!/usr/bin/perl

use strict;

my $sourcedir = "../../../../img/menpat";
my $targetdir = ".";

my $file;
my @files;

opendir(MDIR, $sourcedir) or die "Cannot read source directory $sourcedir\n";;

while ($file = readdir(MDIR)) {
   next if $file =~ /^\./;
   next if $file !~ /\.svg$/;
   next if !-r "$sourcedir/$file";
   $files[@files] = $file;
}
close MDIR;


foreach $file (@files) {
   next if -r "$targetdir/$file";
   print "LINKING $file\n";
   symlink("$sourcedir/$file", "$targetdir/$file");
}


