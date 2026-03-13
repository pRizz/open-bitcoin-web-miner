#!/usr/bin/env bash

remote_report_repo_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd
}

setup_remote_report() {
  local script_name="$1"
  local repo_root=""
  local report_root=""
  local started_at=""
  local timestamp=""

  if [[ "${NO_REMOTE_REPORT:-0}" == "1" ]]; then
    return
  fi

  repo_root="$(remote_report_repo_root)"
  report_root="${REMOTE_REPORT_DIR:-$repo_root/logs/remote-service-reports}"
  mkdir -p "$report_root"

  timestamp="$(date '+%Y-%m-%dT%H-%M-%S%z')"
  started_at="$(date '+%Y-%m-%d %H:%M:%S %z')"
  REMOTE_REPORT_FILE="$report_root/${timestamp}-${script_name}.log"
  export REMOTE_REPORT_FILE

  exec > >(tee -a "$REMOTE_REPORT_FILE") 2>&1

  echo "=============================================="
  echo "  REMOTE SERVICE REPORT"
  echo "=============================================="
  echo "  Script:              $script_name"
  echo "  Started:             $started_at"
  echo "  Workdir:             $(pwd)"
  echo "  Report file:         $REMOTE_REPORT_FILE"
  echo "----------------------------------------------"

  trap 'finish_remote_report $?' EXIT
}

finish_remote_report() {
  local exit_code="$1"
  local status="success"

  if [[ "$exit_code" -ne 0 ]]; then
    status="failure"
  fi

  echo "----------------------------------------------"
  echo "  Finished:            $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo "  Exit code:           $exit_code"
  echo "  Status:              $status"
  echo "=============================================="
}
