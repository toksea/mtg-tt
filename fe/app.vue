<template>
  <div id="wrapper">
    <div id="header">
      <h1>mtg-tt</h1>
    </div>
    <div id="main">
      <form>
	<textarea></textarea>
	<select name="lang">
	  <option value="cn">中文</option>
	  <option value="en">English</option>
	</select>
	<input name="layout" type="radio">3x3
	<input name="layout" type="radio">4x4
      </form>
    </div>
  </div>
</template>

<script>
  module.exports = {
    el: '#app',
  }
</script>
