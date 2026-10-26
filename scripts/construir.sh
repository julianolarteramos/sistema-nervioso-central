#!/usr/bin/env bash
# Construye con vigilancia de RAM: no lanza con menos de 8 GB disponibles y mata los node si `used` pasa de 14 GB.
# Muestrea cada 0,5 s y deja la línea de tiempo en .cache/mem.log (segundos, usada, RSS del proceso mayor y su orden).
# Uso: scripts/construir.sh [args de build.mjs]   (p. ej. --light --quick --view=lat-izq --audit)
cd "$(dirname "$0")/.."
free_mb=$(free -m | awk '/Mem:/ {print $7}')
if [ "$free_mb" -lt 8192 ]; then echo "solo hay $free_mb MB disponibles (<8192): no lanzo"; exit 2; fi
export SNC_JOBS="${SNC_JOBS:-2}"
export SNC_DEBUG="${SNC_DEBUG:-1}"   # el plan de cortes cuenta por dónde va
# Todo lo que sale va también al registro fijo, para verlo desde otra terminal: scripts/estado.sh --seguir
: > .cache/construccion.log 2>/dev/null || { mkdir -p .cache; : > .cache/construccion.log; }
echo "inicio $(date +%H:%M:%S) · args: $*" >> .cache/construccion.log
exec > >(tee -a .cache/construccion.log) 2>&1
LIMIT="${SNC_RAM_LIMIT:-14000}"
mkdir -p .cache
: > .cache/mem.log
node build.mjs "$@" &
pid=$!
peak=0
t0=$(date +%s)
while kill -0 $pid 2>/dev/null; do
  used=$(free -m | awk '/Mem:/ {print $3}')
  [ "$used" -gt "$peak" ] && peak=$used
  top=$(ps -eo rss,args --sort=-rss | grep "[b]uild.mjs" | head -1 | awk '{print int($1/1024)" "$NF}')
  echo "$(( $(date +%s) - t0 )) $used $top" >> .cache/mem.log
  if [ "$used" -gt "$LIMIT" ]; then
    echo "RAM usada $used MB > $LIMIT: mato la construcción (ver .cache/mem.log)"
    pkill -f "node.*build.mjs"
    wait $pid 2>/dev/null; exit 3
  fi
  sleep 0.5
done
wait $pid; code=$?
echo "pico de RAM usada del sistema durante la construcción: $peak MB"
exit $code
