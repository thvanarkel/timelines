import csv
import itertools
import math

# Indices of the rows that need changing
INDEX = 0
TIMESTAMP = 1
LINKS = 2
RECHTS = 3

with open('p2.csv') as csv_file, open('p2_cleaned.csv', 'w') as output:
    csv_reader = list(csv.reader(csv_file, delimiter=","));
    writer = csv.writer(output)
    line_count = 0
    corrected = 0
    for row in csv_reader:
        if line_count == 0:
            print(f'Column names are {", ".join(row)}')
            line_count += 1

        # Break out if the row is empty
        if len(row[INDEX]) == 0:
            break

        # Correct missing timestamps
        if len(row[TIMESTAMP]) == 0:
            t = prevrow[TIMESTAMP].split(":")
            t0 = int(t[0]) * 3600 + int(t[1]) * 60 + int(t[2]);
            length = len(row[LINKS]) + len(row[RECHTS])
            chars = len(prevrow[LINKS]) + len(prevrow[RECHTS]) + length

            n = (line_count - 1)
            emptyrows = 1
            looking = True
            while n:
                nextrow = csv_reader[n+1]
                if len(nextrow[1]) != 0:
                    tend = nextrow[1].split(":")
                    t1 = int(tend[0]) * 3600 + int(tend[1]) * 60 + int(tend[2]);
                    break
                else:
                    chars += len(nextrow[2]) + len(nextrow[3])
                    n += 1
            dt = t1 - t0
            t = length * (dt / chars)
            ts = t0 + t
            h, m, s = str(math.floor(ts / 3600)), str(math.floor(ts / 60 % 60)), str(math.floor(ts % 60))
            row[TIMESTAMP] = f"{h.rjust(1, '0')}:{m.rjust(2, '0')}:{s.rjust(2, '0')}"
            corrected += 1
        # Write out the row
        writer.writerow(row)

        # Store the previous row
        prevrow = row
        line_count += 1

    print(f'Processed {line_count} lines, corrected {corrected} lines')
