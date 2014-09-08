$(function(){
	$("select").not('.tricky').select2({
		width: "off"
	});

	$("select.tricky").select2({
		width: "off",
		containerCssClass: 'tricky-choice',
		dropdownCssClass: 'tricky-dropdown',
		dropdownAutoWidth: true

	});

	$('input[type=checkbox]').ezMark();
	$('input[type=radio]').ezMark();
});