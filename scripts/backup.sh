#!/usr/bin/env bash
# Dump every row of the entries and participants tables to backups/, paging
# past Supabase's 1,000-row response cap. Run from the repo root:
#   bash scripts/backup.sh
set -euo pipefail
set -a; source .env.local; set +a

day=$(date +%Y-%m-%d)
mkdir -p backups
H=(-H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY")

dump() { # table order outfile
  local table=$1 order=$2 out=$3 from=0 tmp
  tmp=$(mktemp -d)
  while :; do
    curl -fsS "${H[@]}" -H "Range: $from-$((from + 999))" \
      "$VITE_SUPABASE_URL/rest/v1/$table?select=*&order=$order" -o "$tmp/$from.json"
    n=$(python3 -I -c "import json,sys; print(len(json.load(open(sys.argv[1]))))" "$tmp/$from.json")
    [ "$n" -lt 1000 ] && break
    from=$((from + 1000))
  done
  python3 -I -c "
import json, sys, glob, os
d = sys.argv[1]
files = sorted(glob.glob(os.path.join(d, '*.json')), key=lambda f: int(os.path.basename(f)[:-5]))
rows = [r for f in files for r in json.load(open(f))]
json.dump(rows, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
print(f'{sys.argv[2]}: {len(rows)} rows')
" "$tmp" "$out"
  rm -rf "$tmp"
}

dump entries "participant_id.asc,day.asc" "backups/entries-$day.json"
dump participants "id.asc" "backups/participants-$day.json"
