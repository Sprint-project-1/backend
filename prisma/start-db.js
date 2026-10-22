import { spawnSync } from "node:child_process";

const CONTAINER_NAME = "cinefund-postgres18";

function runDocker(args, options = {}) {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : "pipe",
  });

  if (result.error) {
    throw result.error;
  }
  return result;
}

function isReady() {
  return (
    runDocker([
      "exec",
      CONTAINER_NAME,
      "pg_isready",
      "-U",
      "cinefund",
      "-d",
      "cinefund",
    ]).status === 0
  );
}

async function main() {
  const inspected = runDocker([
    "inspect",
    "--format",
    "{{.State.Running}}",
    CONTAINER_NAME,
  ]);

  if (inspected.status !== 0) {
    const started = runDocker(["compose", "up", "-d", "--wait"], {
      inherit: true,
    });
    if (started.status !== 0) {
      process.exitCode = started.status ?? 1;
    }
    return;
  }

  if (inspected.stdout.trim() !== "true") {
    const started = runDocker(["start", CONTAINER_NAME]);
    if (started.status !== 0) {
      process.stderr.write(started.stderr);
      process.exitCode = started.status ?? 1;
      return;
    }
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (isReady()) {
      console.log(`${CONTAINER_NAME} 컨테이너가 실행 중이고 PostgreSQL이 준비됐습니다.`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.error(`${CONTAINER_NAME} PostgreSQL이 30초 안에 준비되지 않았습니다.`);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(`PostgreSQL 시작 실패: ${error.message}`);
  process.exitCode = 1;
});
