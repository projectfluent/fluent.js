<hello "Hello, world!">

/* ------------------------------------------------------------------------- */

<l20n "L20n">
<intro[$build] {
  dev: "You're using a dev build of {{ l20n }} (with AMD modules).",
  prod: """
    You're using a production-ready single-file version of {{ l20n }}
    (built with make build and found in dist/html).
  """,
 *unknown: "You're using an unknown version of {{ l20n }}."
}>

/* ------------------------------------------------------------------------- */

<screenWidth """
  The label of the button below changes depending on the 
  available screen width (currently: {{ @screen.width.px }}px).
""">

<formFactor($n) {
  $n.width.px < 480 ? "portraitPhone" :
    $n.width.px < 768 ? "landscapePhone" :
      $n.width.px < 980 ? "landscapeTablet" :
        $n.width.px < 1200 ? "desktop" :
          "large" }>

<button ""
 value[formFactor(@screen)]: {
  *desktop: "Create & insert a <p> element that will be dynamically localized",
   landscapeTablet: "Create & insert a dynamically-localized <p>",
   landscapePhone: "Insert a dynamically-localized <p>",
   portraitPhone: "Insert a <p>"
 }
>

<currentWidth "Current width: {{ @screen.width.px }}px.">

/* ------------------------------------------------------------------------- */

<_options[@os] {
  win: "Settings",
 *nix: "Preferences"
}>

<langNego[$mode] {
  multi: """
    In order to test language negotiation, go to your
    browser's {{ _options }} and change the Accept-Language
    header.  Try setting French (fr) or Polish (pl) as your
    first choice and observe the language fallback at work 
    in the web console.
  """,
  single: """
    In the single-locale mode, no locales have been registered.
    There is no language negotiation on the client side nor
    language fallback.  This may be useful for server-side or
    build-time language negotiation scenarios.
  """
}>

/* ------------------------------------------------------------------------- */

<timeOfDay($h) {
  $h < 6 ? "night" :
    $h < 12 ? "morning" :
      $h < 18 ? "afternoon" :
        "evening" }>

<more """
  For more information, visit <a>L20n.org</a>.
""">

<kthxbye[timeOfDay(@hour)] {
  morning: "Enjoy your morning!",
  afternoon: "Have a great rest of the day!",
  evening: "Have fun tonight!",
  night: "Y U NO asleep‽"
}>
