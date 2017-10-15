var ss = SpreadsheetApp.getActive();

// シートの取得（なければ作成）
var schedule = ss.getSheetByName('schedule');
var resource = ss.getSheetByName('resource');
var EVM = ss.getSheetByName('EVM');
var PDM = ss.getSheetByName('PDM');
if(!schedule){schedule = ss.insertSheet('schedule', 1);}
if(!resource){resource = ss.insertSheet('resource', 2);}
if(!EVM){EVM = ss.insertSheet('EVM', 3);}
if(!PDM){PDM = ss.insertSheet('PDM', 4)}

//スケジュールシート情報取得
var firstRow = schedule.getRange('1:1')
var RowNum = firstRow.getNumColumns();

//フォーマット用アセット
var items = [
['No.', 'タスク名', '予定開始', '予定終了', '予定工数', '実際開始', '実際終了', '実際工数', '担当', '進捗'],
['wbs', 'tasks','planedStart', 'planedFinish', 'planedWorkload', 'actualStart', 'actualFinish', 'actualWorkload', 'responsiblity', 'progress']
];
var wbsColumnNameLength = items[0].length;



function onOpen() {
  //WBSの情報がなければガントチャート追加
  var checkedRange = schedule.getRange(3, 2, 100, 1);
  if(checkedRange.isBlank()) {
    //月曜スタートになるよう調整
    var today = Moment.moment();
    var tmp = 0;
    while (Math.abs(today.day()) + tmp <= 7) {
     tmp++;
   };
   var monday = today.add(tmp, 'days');

   init();
   formatGantchart(7, monday.format('YYYY/MM/DD'));
 };

  //カスタムメニューをUIに追加
  SpreadsheetApp.getUi()
  .createMenu('カスタムメニュー')
      .addItem('サイドバーの表示', 'showSidebar') //表示名、関数名
      .addToUi();
      showSidebar();
    }

    function onEdit(e) {
  // スケジュールシートの機能
  if (e.source.getActiveSheet().getName() == 'schedule') {
    var range = e.range;
    var editedRow = parseInt(range.getRow());
    var editedColumn = parseInt(range.getColumn());
    var lastRow = parseInt(range.getLastRow());
    var lastColumn = parseInt(range.getLastColumn());
    var selectedItem = schedule.getRange(2, editedColumn).getValue();


    if (selectedItem === 'tasks' || 'planedStart' || 'planedFinish' || 'actualStart' || 'actualFinish') {
      var progressColumn = parseInt(findStartPoint('progress')) - 1;
      var itemKeys = schedule.getRange(2, 1, 1, progressColumn).getValues();


      for (var i = 0; i < lastRow; i++) {
        var planedStart = Moment.moment(schedule.getRange(editedRow, itemKeys[0].indexOf('planedStart')+1).getValue());
        var planedFinish = Moment.moment(schedule.getRange(editedRow, itemKeys[0].indexOf('planedFinish')+1).getValue());
        var actualStart = Moment.moment(schedule.getRange(editedRow, itemKeys[0].indexOf('actualStart')+1).getValue());
        var actualFinish = Moment.moment(schedule.getRange(editedRow, itemKeys[0].indexOf('actualFinish')+1).getValue());
        var baseDate = Moment.moment(schedule.getRange(2, progressColumn+1).getValue());
        var chartFinish = progressColumn+1 + planedFinish.diff(baseDate, 'days');


        //フォーマットをリセット
        schedule.getRange(editedRow, progressColumn+1, 1, RowNum).setBackground('');
        for (var j = progressColumn+1; RowNum >= j; j++) {
          if ((j - progressColumn) % 7 === 0) {
            schedule.getRange(editedRow, j-1, 1, 2).setBackground('#fcefe3');
          };
        };

        //マイルストーンを置く
        if (planedFinish.format('YYYY') != 'Invalid date' && planedStart.format('YYYY') == 'Invalid date') {
          if (chartFinish >= progressColumn+1 && chartFinish < RowNum){
            schedule.getRange(editedRow, chartFinish).setBackground('#FFBB00');
          };
        };
        var editedRow = editedRow + 1;
      };
    };

  };
};








//関数〜
//サイドバーの表示
function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Page')
  .setTitle('プロジェクトマネジメント')
  .setWidth(300);
  SpreadsheetApp.getUi()
  .showSidebar(html);
};

//初期フォーマット
function init(){
  schedule.setFrozenRows(1);
  schedule.setFrozenColumns(2);
  schedule.hideRows(2);
  schedule.setRowHeight(1, 31.5);
  firstRow.setBackground('#f3f3f3');
  var wbsColumnRange = schedule.getRange(1, 1, 2, wbsColumnNameLength);
  wbsColumnRange.setValues(items);

  // 列の追加
  if (RowNum < 30) {
    schedule.insertColumns(wbsColumnNameLength+1, 180);
    RowNum = schedule.getRange('1:1').getNumColumns();
  }
};

//ガントチャートのフォーマット
function formatGantchart(span, date) {
  var line_column = findStartPoint('progress');
  var date = Moment.moment(date);

  //日付をconfigに記録
  schedule.getRange(2, line_column).setValue(date.format('YYYY/MM/DD'));

  //列幅
  for (var i = line_column; RowNum >= i; i++) {
    schedule.setColumnWidth(i, 25);
    if ((i - line_column+1) % 7 === 0) {
      schedule.getRange(2, i-1, 1000, 2).setBackground('#fcefe3');
    }
  };
  //枠線と日付
  while (RowNum >= line_column){
   var range = schedule.getRange(1, line_column, 1000, line_column+span);
   range.setBorder(null, true, null, true, false, false, "black", SpreadsheetApp.BorderStyle.SOLID);
   var range = schedule.getRange(1, line_column, 1, 1);
   range.setValue('(' + date.format('YYYY/MM/DD') + ')');
   line_column += span;
   date = date.add(span, 'days');
 };
};

function findStartPoint (text) {
  var ary = schedule.getRange('2:2').getValues();
  if (ary[0].indexOf(text) < 0) {
    alert('2列目が変更されています。初期化してください');
  } else {
   return ary[0].indexOf('progress') + 2;
 }
}



