#!/usr/bin/perl
#
# Programmer:    Craig Stuart Sapp <craig.stanford.edu>
# Creation Date: Tue Oct 14 14:56:43 PDT 2014
# Last Modified: Fri Mar  6 14:06:13 PST 2015 Added variant fallback
# Filename:      /disk/data2/craig-project/josquin/web/website-jrp2/audio/mp3/x
# Syntax:        perl 5
#
# Description:   Collect MIDI-originating MP3 files from various repertory
#                data directories.
#

use strict;
my $datadir = "/project/josquin/data";
my $subdir  = "midi-mp3/default";

processData($datadir, $subdir);
makeWorkLinks();

exit(0);


###########################################################################



##############################
##
## processData --
##

sub processData {
   my ($datadir, $subdir) = @_;
   my $file;
   opendir(DDIR, $datadir) or die "Cannot find $datadir\n";
   while ($file = readdir(DDIR)) {
      next if $file =~ /^\./;
      next if !-d "$datadir/$file";
      next if $file !~ /^[A-Z][a-z][a-z]$/;
      # next if !-r "$datadir/$file/.set-jrp";
      next if !-r "$datadir/$file/$subdir";
      makeLinks($datadir, $file, $subdir);
   }
   closedir(DDIR);
}



##############################
##
## makeLinks --
##

sub makeLinks {
   my ($datadir, $repertory, $subdir) = @_;
   my $newdir = "$datadir/$repertory/$subdir";
   opendir(ADIR, $newdir) or die "Cannot open $newdir";
   my $file;
   my $base;
   my $ext;
   while ($file = readdir(ADIR)) {
      next if $file =~ /^\./;
      next if !-r "$datadir/$repertory/$subdir/$file";
      next if $file !~ /([A-Z][a-z][a-z]\d{4}[^-]*).*\.(.{3})$/;
      $base = $1;
      $ext  = $2;
      next if -r "$base.$ext";
      print "Linking $base ...\n";
      `ln -s $datadir/$repertory/$subdir/$file $base.$ext`;
   }
   closedir(ADIR);
}



##############################
##
## makeWorkLinks -- If there is not a base work recording, use the
##      first one in a list of movements or variants.
##

sub makeWorkLinks {
   opendir(DIR, ".") or die;
   my $file;
   my %ids;
   while ($file = readdir(DIR)) {
      next if $file =~ /^\./;
      next if $file !~ /([A-Z][a-z][a-z].*)\.(.{3})/;
      $ids{$1}++;
   }
   closedir(DIR);

   my $base;
   foreach my $key (sort keys %ids) {
      next if $key =~ /^[A-Z][a-z][a-z]\d{4}$/;
      if ($key !~ /^([A-Z][a-z][a-z]\d{4})([\.\d]*)/) {
         next;
      }
      $base = $1;
      next if !-r "$key.mp3";
      next if -r "$base.mp3";
      print "Linking $key to $base ...\n";
      `ln -s $key.mp3 $base.mp3`;
   }
}



