# sheet.xml

保存一张工作簿行高列宽、合并区域、条件公式以及单元格值、样式、公式等信息。

压缩位置`worksheets/sheet?.xml`

具体结构如下

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
           xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
           xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"
           xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
           xmlns:etc="http://www.wps.cn/officeDocument/2017/etCustomData">
    <sheetPr/>
    <dimension ref="A1:I38"/>
    <sheetViews>
        <sheetView zoomScale="280" zoomScaleNormal="280" topLeftCell="A2" workbookViewId="0">
            <selection activeCell="B13" sqref="B13:B14"/>
        </sheetView>
    </sheetViews>
    <sheetFormatPr defaultColWidth="9" defaultRowHeight="16.8"/>
    <cols>
        <col min="1" max="1" width="32.2211538461538" customWidth="1"/>
        <col min="2" max="2" width="20.625" customWidth="1"/>
    </cols>
    <sheetData>
        <row r="1" spans="2:9">
            <c r="B1">
                <v>1</v>
            </c>
            <c r="C1">
                <v>2</v>
            </c>
            <c r="D1">
                <v>3</v>
            </c>
            <c r="E1">
                <v>4</v>
            </c>
            <c r="F1">
                <v>5</v>
            </c>
            <c r="G1">
                <v>6</v>
            </c>
            <c r="H1">
                <v>7</v>
            </c>
            <c r="I1">
                <v>8</v>
            </c>
        </row>
        <row r="3" spans="1:9">
            <c r="A3" t="s">
                <v>0</v>
            </c>
            <c r="B3" s="10"/>
            <c r="D3" s="11" t="s">
                <v>1</v>
            </c>
            <c r="E3" s="22" t="s">
                <v>2</v>
            </c>
            <c r="G3" s="23" t="s">
                <v>3</v>
            </c>
            <c r="I3" s="28" t="s">
                <v>4</v>
            </c>
        </row>
    </sheetData>
    <mergeCells count="2">
        <mergeCell ref="B11:C11"/>
        <mergeCell ref="B13:B14"/>
    </mergeCells>
    <conditionalFormatting sqref="B30">
        <cfRule type="expression" dxfId="0" priority="2">
            <formula>$B$30&gt;1</formula>
        </cfRule>
    </conditionalFormatting>
    <conditionalFormatting sqref="C30">
        <cfRule type="expression" dxfId="1" priority="1">
            <formula>$C$30&lt;=22</formula>
        </cfRule>
    </conditionalFormatting>
    <pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.5" footer="0.5"/>
    <headerFooter/>
    <legacyDrawing r:id="rId2"/>
</worksheet>
```

转换为Golang的结构体为

```go
type xmlSheet struct {
  	XMLName   xml.Name    `xml:"http://schemas.openxmlformats.org/spreadsheetml/2006/main worksheet"`
		
}
```



