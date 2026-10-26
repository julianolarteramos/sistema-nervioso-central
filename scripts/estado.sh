#!/usr/bin/env bash
# Panel de estado de la construcción. Uso:  scripts/estado.sh            (una vez)
#                                           scripts/estado.sh --seguir   (se refresca cada 2 s; Ctrl-C para salir)
cd "$(dirname "$0")/.."
panel() {
  echo "── construcción del modelo SNC · $(date +%H:%M:%S) ──"
  local procs
  procs=$(ps -eo pid,etime,pcpu,rss,args | grep -E "[b]uild.mjs" | grep -v grep)
  if [ -z "$procs" ]; then
    echo "no hay ninguna construcción corriendo"
  else
    echo "procesos (pid · tiempo · %cpu · MB · qué hace):"
    echo "$procs" | awk '{ pid=$1; et=$2; cpu=$3; mb=int($4/1024); what="principal";
      for (i=5;i<=NF;i++) { if ($i ~ /^--paint=/) { what="pintar " substr($i,9); break } if ($i ~ /^--settle=/) { split(substr($i,10),a,","); what="orden+auditoría de la vista " a[1]; break } }
      printf "  %-7s %-9s %5s%% %6d MB  %s\n", pid, et, cpu, mb, what }'
  fi
  free -m | awk '/Mem:/ {printf "memoria del sistema: %d MB en uso, %d MB libres de %d\n", $3, $7, $2}'
  echo "── últimas líneas de .cache/construccion.log ──"
  tail -n 12 .cache/construccion.log 2>/dev/null | cut -c1-170
  echo "── fase ──"
  local last
  last=$(grep -E "orden:|auditoría:|plan|ronda|pintado:|escribí" .cache/construccion.log 2>/dev/null | tail -1 | cut -c1-170)
  echo "${last:-sin datos todavía}"
}
if [ "$1" = "--seguir" ]; then
  while true; do clear; panel; sleep 2; done
else
  panel
fi
