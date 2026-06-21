# KBBQ 홈페이지 수정 프롬프트

대상 저장소: `kim6410/kkbbq`

아래 항목을 한 번에 수정한다.

## 1. 전화번호 통일

모든 화면 표시 전화번호를 `0507-1393-5889`로 통일한다.

모든 전화 링크는 아래 값으로 통일한다.

```html
href="tel:050713935889"
```

`031-855-5888` 표기는 제거한다.

## 2. 예약 URL 정리

예약 기본 URL은 아래 값으로 통일한다.

```text
https://m.booking.naver.com/booking/6/bizes/425958/items/3631234?area=pll&lang=ko&service-target=map-pc
```

`assets/js/kbbq-floating.js`에서는 한국 시간 기준 오늘 날짜를 계산해 `startDate=YYYY-MM-DD`를 붙인다.

예시 함수:

```js
function getKoreaTodayYmd() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function getBookingUrl() {
  const url = new URL(KBBQ_FLOAT_CONFIG.bookingBaseUrl);
  url.searchParams.set("startDate", getKoreaTodayYmd());
  return url.toString();
}
```

모든 예약 링크에는 `data-kbbq-booking-link="true"`를 붙이고, JS에서 페이지 로드 시 현재 날짜가 붙은 URL로 갱신한다.

## 3. HTML 문법 정리

`index.html`의 `<p>` 안에 들어간 `<div class=""></div>`를 제거한다.

`<FONT>` 태그는 모두 제거하고 기존 `.kbbq-cta p` 스타일을 사용한다.

`</br>`는 `<br>`로 수정한다.

## 4. 모바일 클릭 처리 중복 제거

`assets/js/kbbq-motion.js`에서는 히어로 슬라이드와 reveal 처리만 남긴다.

모바일 버튼 클릭 처리 코드는 `assets/js/kbbq-floating.js` 한 곳에만 남긴다.

## 5. 메타 설명 지역 키워드 보강

각 페이지 description을 아래처럼 교체한다.

### index.html

```html
<meta name="description" content="경기 양주시 광적면 강경숯불바베큐 양주점. 정원과 연못, 숯불 향이 있는 양주 바베큐 맛집으로 가족 외식, 회식, 단체 모임 예약이 가능합니다." />
```

### menu.html

```html
<meta name="description" content="양주 광적면 강경숯불바베큐 양주점 메뉴 안내. 2인, 3인, 4인 BBQ 세트와 토마호크, 꽃삼겹, 꽃목살 구성을 확인하세요." />
```

### reservation.html

```html
<meta name="description" content="양주 광적면 강경숯불바베큐 양주점 예약 안내. 가족 외식, 회식, 단체 모임, 주말 바베큐 예약 방법과 전화 문의 정보를 확인하세요." />
```

### reviews.html

```html
<meta name="description" content="양주 숯불 바베큐 맛집 강경숯불바베큐 양주점 방문 후기. 정원, 연못, 불멍, 가족 외식, 단체 모임 분위기를 확인하세요." />
```

### sns.html

```html
<meta name="description" content="강경숯불바베큐 양주점의 네이버예약, 블로그, 인스타그램, 당근마켓, 구글지도 채널을 한곳에서 확인하세요." />
```

### contact.html

```html
<meta name="description" content="경기 양주시 광적면 삼일로 123-74 강경숯불바베큐 양주점 오시는 길. 주차 가능, 네이버예약, 구글 길찾기, 전화 문의 정보를 확인하세요." />
```

## 완료 후 검증

아래 문자열이 남아 있으면 실패다.

```text
031-855-5888
startDate=2026-06-07
<FONT
</br>
<div class=""></div>
pcmap.place.naver.com/restaurant/1454453827/booking
```

아래 문자열은 반드시 있어야 한다.

```text
0507-1393-5889
050713935889
getKoreaTodayYmd
getBookingUrl
data-kbbq-booking-link
```
