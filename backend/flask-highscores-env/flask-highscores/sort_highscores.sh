#!/bin/bash

# -n stands for numerical comparisons (vs string comparisons)
# -r stands for descending order instead of ascending
# `-t,` means we want to use the comma as a separator

# `-k2,2` means we are sorting from the 2nd column to the 2nd column

# -o means we generate output to the *same* input file, `sort`
# handles the creation of a tmp file

sort -n -r -t, -k2,2 highscores.csv -o highscores.csv
