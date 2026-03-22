---
title: USB 장치 스캔
description: sd scan-usb를 사용하여 연결된 USB 이동식 저장 장치를 자동으로 탐지하고 악성코드를 스캔합니다.
---

# USB 장치 스캔

`sd scan-usb` 명령어는 연결된 이동식 USB 저장 장치를 탐지하고 악성코드를 위해 내용을 스캔합니다. 이는 에어갭 네트워크, 공유 워크스테이션, 산업 제어 시스템과 같이 USB 드라이브가 악성코드 전달의 일반적인 벡터인 환경에서 매우 중요합니다.

## 작동 방식

호출되면 `sd scan-usb`는 다음 단계를 수행합니다:

1. **장치 탐지** -- `/sys/block/`을 통해 블록 장치를 열거하고 이동식 장치(USB 대용량 저장소)를 식별합니다.
2. **마운트 탐지** -- 장치가 이미 마운트되었는지 확인합니다. 그렇지 않으면 선택적으로 임시 디렉토리에 읽기 전용 모드로 마운트할 수 있습니다.
3. **전체 스캔** -- 장치의 모든 파일에 완전한 탐지 파이프라인(해시 매칭, YARA 규칙, 휴리스틱 분석)을 실행합니다.
4. **보고서** -- 파일별 판정이 있는 스캔 보고서를 생성합니다.

::: tip 자동 마운트
기본적으로 `sd scan-usb`는 이미 마운트된 장치를 스캔합니다. `--auto-mount`를 사용하여 마운트되지 않은 USB 장치를 스캔을 위해 읽기 전용 모드로 자동 마운트합니다.
:::

## 기본 사용법

모든 연결된 USB 저장 장치 스캔:

```bash
sd scan-usb
```

예제 출력:

```
PRX-SD USB 스캔
===============
탐지된 USB 장치:
  /dev/sdb1 → /media/user/USB_DRIVE (vfat, 16 GB)

/media/user/USB_DRIVE 스캔 중...
스캔됨: 847개 파일 (2.1 GB)
위협: 1개

  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe
    레이어:   YARA 규칙
    규칙:    win_worm_usb_spreader
    세부 정보: autorun.inf 익스플로잇을 사용하는 USB 웜

소요 시간: 4.2s
```

## 명령어 옵션

| 옵션 | 축약 | 기본값 | 설명 |
|--------|-------|---------|-------------|
| `--auto-quarantine` | `-q` | 끄기 | 탐지된 위협 자동 격리 |
| `--auto-mount` | | 끄기 | 마운트되지 않은 USB 장치를 읽기 전용 모드로 마운트 |
| `--device` | `-d` | 모두 | 특정 장치만 스캔 (예: `/dev/sdb1`) |
| `--json` | `-j` | 끄기 | JSON 형식으로 결과 출력 |
| `--eject-after` | | 끄기 | 스캔 후 장치 안전하게 꺼내기 |
| `--max-size-mb` | | 100 | 이 크기보다 큰 파일 건너뜀 |

## 자동 격리

USB 장치에서 발견된 위협 자동 격리:

```bash
sd scan-usb --auto-quarantine
```

```
/media/user/USB_DRIVE 스캔 중...
  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe → 격리됨 (QR-20260321-012)
  [MALICIOUS] /media/user/USB_DRIVE/.hidden/payload.bin → 격리됨 (QR-20260321-013)

격리된 위협: 2개
사용 안전: 나머지 파일을 열기 전에 검토하세요.
```

::: warning 중요
`--auto-quarantine`을 USB 스캔과 함께 사용하면 악성 파일이 호스트 머신의 로컬 격리 저장소로 이동되고 USB 장치에서 삭제되지 않습니다. USB의 원본 파일은 `--remediate`를 함께 사용하지 않으면 그대로 유지됩니다.
:::

## 특정 장치 스캔

여러 USB 장치가 연결된 경우 특정 장치만 스캔:

```bash
sd scan-usb --device /dev/sdb1
```

스캔하지 않고 탐지된 USB 장치 목록:

```bash
sd scan-usb --list
```

```
탐지된 USB 저장 장치:
  1. /dev/sdb1  Kingston DataTraveler  16 GB  vfat  마운트됨: /media/user/USB_DRIVE
  2. /dev/sdc1  SanDisk Ultra          64 GB  exfat 마운트되지 않음
```

## JSON 출력

```bash
sd scan-usb --json
```

```json
{
  "scan_type": "usb",
  "timestamp": "2026-03-21T17:00:00Z",
  "devices": [
    {
      "device": "/dev/sdb1",
      "label": "USB_DRIVE",
      "filesystem": "vfat",
      "size_gb": 16,
      "mount_point": "/media/user/USB_DRIVE",
      "files_scanned": 847,
      "threats": [
        {
          "path": "/media/user/USB_DRIVE/autorun.exe",
          "verdict": "malicious",
          "layer": "yara",
          "rule": "win_worm_usb_spreader"
        }
      ]
    }
  ]
}
```

## 일반적인 USB 위협

USB 장치는 다음과 같은 유형의 악성코드를 전달하는 데 자주 사용됩니다:

| 위협 유형 | 설명 | 탐지 레이어 |
|-------------|-------------|-----------------|
| Autorun 웜 | Windows에서 실행하기 위해 `autorun.inf`를 익스플로잇 | YARA 규칙 |
| USB 드로퍼 | 위장된 실행 파일 (예: `document.pdf.exe`) | 휴리스틱 + YARA |
| BadUSB 페이로드 | HID 에뮬레이션 공격을 대상으로 하는 스크립트 | 파일 분석 |
| 랜섬웨어 캐리어 | 복사 시 활성화되는 암호화된 페이로드 | 해시 + YARA |
| 데이터 유출 도구 | 데이터를 수집하고 추출하도록 설계된 유틸리티 | 휴리스틱 분석 |

## 실시간 모니터링과의 통합

`sd monitor` 데몬과 USB 스캔을 결합하여 USB 장치가 연결될 때 자동으로 스캔할 수 있습니다:

```bash
sd monitor --watch-usb /home /tmp
```

이것은 실시간 파일 모니터를 시작하고 USB 자동 스캔 기능을 추가합니다. udev를 통해 새 USB 장치가 탐지되면 자동으로 스캔됩니다.

::: tip 키오스크 모드
공공 터미널이나 공유 워크스테이션의 경우 `--watch-usb`와 `--auto-quarantine`을 결합하여 사용자 개입 없이 USB 장치의 위협을 자동으로 무력화합니다.
:::

## 다음 단계

- [파일 및 디렉토리 스캔](./file-scan) -- `sd scan`의 전체 레퍼런스
- [메모리 스캔](./memory-scan) -- 실행 중인 프로세스 메모리 스캔
- [루트킷 탐지](./rootkit) -- 시스템 레벨 위협 확인
- [탐지 엔진](../detection/) -- 다층 파이프라인 작동 방식
