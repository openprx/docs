---
title: ინსტალაცია
description: PRX-SD-ის ინსტალაცია Linux-ზე, macOS-ზე ან Windows WSL2-ზე ინსტალაციის სკრიპტის, Cargo-ს, საწყისი კოდიდან აწყობის ან Docker-ის გამოყენებით.
---

# ინსტალაცია

PRX-SD მხარს უჭერს ინსტალაციის ოთხ მეთოდს. აირჩიეთ ის, რომელიც თქვენს სამუშაო პროცესს ყველაზე მეტად შეესაბამება.

::: tip რეკომენდებული
**ინსტალაციის სკრიპტი** დაწყების ყველაზე სწრაფი გზაა. ის პლატფორმას ავტომატურად განსაზღვრავს, შესაბამის ბინარს ჩამოტვირთავს და PATH-ში ათავსებს.
:::

## წინაპირობები

| მოთხოვნა | მინიმალური | შენიშვნები |
|-------------|---------|-------|
| საოპერაციო სისტემა | Linux (x86_64, aarch64), macOS (12+), Windows (WSL2) | ნატიური Windows არ არის მხარდაჭერილი |
| დისკის ადგილი | 200 MB | ~50 MB ბინარი + ~150 MB სიგნატურების მონაცემთა ბაზა |
| RAM | 512 MB | 2 GB+ რეკომენდებულია დიდი დირექტორიების სკანირებისთვის |
| Rust (მხოლოდ წყაროდან) | 1.85.0 | სკრიპტის ან Docker ინსტალაციისთვის არ არის საჭირო |
| Git (მხოლოდ წყაროდან) | 2.30+ | რეპოზიტორის კლონირებისთვის |
| Docker (მხოლოდ Docker-ისთვის) | 20.10+ | ან Podman 3.0+ |

## მეთოდი 1: ინსტალაციის სკრიპტი (რეკომენდებული)

ინსტალაციის სკრიპტი პლატფორმისთვის ყველაზე ახლო გამოშვების ბინარს ჩამოტვირთავს და `/usr/local/bin`-ში ათავსებს.

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash
```

კონკრეტული ვერსიის ინსტალაციისთვის:

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash -s -- --version 0.5.0
```

სკრიპტი მხარს უჭერს შემდეგ გარემოს ცვლადებს:

| ცვლადი | ნაგულისხმევი | აღწერა |
|----------|---------|-------------|
| `INSTALL_DIR` | `/usr/local/bin` | მომხმარებლის ინსტალაციის დირექტორია |
| `VERSION` | `latest` | კონკრეტული გამოშვების ვერსია |
| `ARCH` | ავტო-გამოვლენა | არქიტექტურის გადაწყობა (`x86_64`, `aarch64`) |

## მეთოდი 2: Cargo-ს ინსტალაცია

თუ Rust გაქვთ დაინსტალირებული, შეგიძლიათ პირდაპირ crates.io-დან დააინსტალიროთ:

```bash
cargo install prx-sd
```

ეს წყაროდან ასხამს და `sd` ბინარს `~/.cargo/bin/`-ში ათავსებს.

::: warning Build-ის დამოკიდებულებები
Cargo install ნატიურ დამოკიდებულებებს ასხამს. Debian/Ubuntu-ზე შეიძლება დაგჭირდეთ:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
macOS-ზე Xcode Command Line Tools საჭიროა:
```bash
xcode-select --install
```
:::

## მეთოდი 3: საწყისი კოდიდან აწყობა

რეპოზიტორის კლონირება და Release რეჟიმში აწყობა:

```bash
git clone https://github.com/openprx/prx-sd.git
cd prx-sd
cargo build --release
```

ბინარი მდებარეობს `target/release/sd`-ში. PATH-ში კოპირება:

```bash
sudo cp target/release/sd /usr/local/bin/sd
```

### Build-ის პარამეტრები

| Feature Flag | ნაგულისხმევი | აღწერა |
|-------------|---------|-------------|
| `yara` | ჩართული | YARA-X წესების ძრავა |
| `ml` | გამორთული | ONNX ML ინფერენციის ძრავა |
| `gui` | გამორთული | Tauri + Vue 3 სამაგიდო GUI |
| `virustotal` | გამორთული | VirusTotal API ინტეგრაცია |

ML ინფერენციის მხარდაჭერით build:

```bash
cargo build --release --features ml
```

სამაგიდო GUI-ს build:

```bash
cargo build --release --features gui
```

## მეთოდი 4: Docker

ოფიციალური Docker სურათის ჩამოტვირთვა:

```bash
docker pull ghcr.io/openprx/prx-sd:latest
```

სამიზნე დირექტორიის მიმაგრებით სკანირება:

```bash
docker run --rm -v /path/to/scan:/scan ghcr.io/openprx/prx-sd:latest scan /scan --recursive
```

რეალურ დროში მონიტორინგისთვის, დემონის სახით გაშვება:

```bash
docker run -d \
  --name prx-sd \
  --restart unless-stopped \
  -v /home:/watch/home:ro \
  -v /tmp:/watch/tmp:ro \
  ghcr.io/openprx/prx-sd:latest \
  monitor /watch/home /watch/tmp
```

::: tip Docker Compose
`docker-compose.yml` ხელმისაწვდომია რეპოზიტორის root-ში, სიგნატურების ავტომატური განახლებებით პროდუქციული განლაგებისთვის.
:::

## პლატფორმის შენიშვნები

### Linux

PRX-SD მუშაობს ნებისმიერ თანამედროვე Linux დისტრიბუციაზე. რეალურ დროში მონიტორინგისთვის გამოიყენება `inotify` ქვესისტემა. დიდი დირექტორიის ხეებისთვის watch ლიმიტის გაზრდა შეიძლება დაგჭირდეთ:

```bash
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

Rootkit-ის გამოვლენა და მეხსიერების სკანირება root პრივილეგიებს საჭიროებს.

### macOS

PRX-SD macOS-ზე რეალურ დროში მონიტორინგისთვის FSEvents-ს იყენებს. Apple Silicon (aarch64) და Intel (x86_64) ორივე მხარდაჭერილია. ინსტალაციის სკრიპტი ავტომატურად ადგენს არქიტექტურას.

::: warning macOS Gatekeeper
თუ macOS ბინარს ბლოკავს, quarantine ატრიბუტი ამოიღეთ:
```bash
xattr -d com.apple.quarantine /usr/local/bin/sd
```
:::

### Windows (WSL2)

PRX-SD WSL2-ში Linux ბინარის გამოყენებით მუშაობს. ჯერ დააინსტალირეთ WSL2 Linux დისტრიბუციასთან ერთად, შემდეგ Linux-ის ინსტალაციის ნაბიჯები მიჰყევით. ნატიური Windows-ის მხარდაჭერა მომავალი გამოშვებისთვის იგეგმება.

## ინსტალაციის გადამოწმება

ინსტალაციის შემდეგ, გადაამოწმეთ, რომ `sd` მუშაობს:

```bash
sd --version
```

მოსალოდნელი გამოტანა:

```
prx-sd 0.5.0
```

სრული სისტემის სტატუსის, სიგნატურების მონაცემთა ბაზის ჩათვლით, შემოწმება:

```bash
sd info
```

ეს აჩვენებს დაინსტალირებულ ვერსიას, სიგნატურების რაოდენობას, YARA წესების რაოდენობას და მონაცემთა ბაზის გზებს.

## დეინსტალაცია

### სკრიპტი / Cargo-ს ინსტალაცია

```bash
# ბინარის ამოღება
sudo rm /usr/local/bin/sd
# ან თუ Cargo-ს საშუალებით იყო დაინსტალირებული
cargo uninstall prx-sd

# სიგნატურების მონაცემთა ბაზისა და კონფიგურაციის ამოღება
rm -rf ~/.config/prx-sd
rm -rf ~/.local/share/prx-sd
```

### Docker

```bash
docker stop prx-sd && docker rm prx-sd
docker rmi ghcr.io/openprx/prx-sd:latest
```

## შემდეგი ნაბიჯები

- [სწრაფი დაწყება](./quickstart) -- 5 წუთში სკანირების დაწყება
- [ფაილებისა და დირექტორიების სკანირება](../scanning/file-scan) -- `sd scan` ბრძანების სრული ცნობარი
- [გამოვლენის ძრავის მიმოხილვა](../detection/) -- მრავალ შრეიანი კონვეიერის გაგება
