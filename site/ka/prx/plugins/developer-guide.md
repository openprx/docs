---
title: დანამატის დეველოპერის სახელმძღვანელო
description: ნაბიჯ-ნაბიჯ სახელმძღვანელო PRX დანამატების შესაქმნელად დანამატის განვითარების ნაკრებით.
---

# დანამატის დეველოპერის სახელმძღვანელო

ეს სახელმძღვანელო PRX დანამატის ნულიდან შექმნის პროცესს გაგივლით. დასრულებისას, გექნებათ მომუშავე ინსტრუმენტის დანამატი, რომელიც PRX-ში ჩაიტვირთება.

## წინაპირობები

- Rust ინსტრუმენტარიუმი `wasm32-wasi` სამიზნით
- PRX CLI დაყენებული
- WASM კონცეფციების ბაზისური ცოდნა

## პროექტის დაყენება

```bash
# WASM სამიზნის დაყენება
rustup target add wasm32-wasi

# ახალი დანამატის პროექტის შექმნა
cargo new --lib my-plugin
cd my-plugin
```

დაამატეთ PRX PDK თქვენს `Cargo.toml`-ში:

```toml
[dependencies]
prx-pdk = "0.1"

[lib]
crate-type = ["cdylib"]
```

## ინსტრუმენტის დანამატის დაწერა

მინიმალური ინსტრუმენტის დანამატი `Tool` თვისებას ახორციელებს:

```rust
use prx_pdk::prelude::*;

#[prx_tool]
fn hello(name: String) -> Result<String, PluginError> {
    Ok(format!("Hello, {}!", name))
}
```

## აწყობა

```bash
cargo build --target wasm32-wasi --release
```

კომპილირებული დანამატი `target/wasm32-wasi/release/my_plugin.wasm` ბილიკზე იქნება.

## ლოკალური ტესტირება

```bash
prx plugin install ./target/wasm32-wasi/release/my_plugin.wasm
prx plugin test my-plugin
```

## გამოქვეყნება

დანამატების გაზიარება `.wasm` ფაილებით ან დანამატის რეესტრში გამოქვეყნებით შეიძლება (მალე).

## დაკავშირებული გვერდები

- [დანამატის სისტემის მიმოხილვა](./)
- [PDK მითითება](./pdk)
- [ჰოსტ ფუნქციები](./host-functions)
- [მაგალითები](./examples)
