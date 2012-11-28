<title "Hello, world!">
<title2 "Bonjour le monde !">

<plural($n) { $n<=0 ? 'zero' : $n<1 ? "almost" : $n==1 ? "one" : "many" }>
<progress[plural($timeleft)] {
  zero: 'Done',
  almost: 'Almost there!',
  one: '1 minute left',
  many: '{{ $timeleft }} minutes left'
}>

<brandName1 "Firefox">

<update1 '{{ brandName1 }} has been updated.'>

<brandName2 "Aurora">

<update2 '{{ brandName2 }} has been updated.'>

<brandName3 "Firefox"
  gender: 'male'>

<update3[brandName3..gender] {
  male: '{{ brandName3 }} zosta<em>ł</em> zaktualizowan<em>y</em>.',
  female: '{{ brandName3 }} zosta<em>ła</em> zaktualizowan<em>a</em>.'
}>

<brandName4 "Aurora"
  gender: 'female'>

<update4[brandName4..gender] {
  male: '{{ brandName4 }} zosta<em>ł</em> zaktualizowan<em>y</em>.',
  female: '{{ brandName4 }} zosta<em>ła</em> zaktualizowan<em>a</em>.'
}>

<about1 "About {{ brandName1 }}">
<about2 "About {{ brandName2 }}">

<brandName5 {
  nominative: "Firefox",
  locative: "Firefoksie"
}>

<about5 "O {{ brandName5.locative }}">

<brandName6 {
  nominative: "Aurora",
  locative: "Aurorze"
}>
<about6 "O {{ brandName6.locative }}">

