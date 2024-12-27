# OpenXML 基础

OpenXML是一个基于**XML**的文件格式标准，主要用处理Office的文档，包括Word、Excel和PowerPoint等。

由于其无依赖性（非必须使用Microsoft Office)，我们可以自行开发Excel。

> 微软提供了一套以C#为编程语言，操作OpenXML的[SDK](https://learn.microsoft.com/en-us/office/open-xml/open-xml-sdk)

使用该[**demo.xlsx**](https://fs.hujye.com/demos/demo.xlsx)为例子

以`.xlsx`文件为基准，可以将其为后缀的文件按照`unzip`的方式进行解压。

```shell
unzip demo.xlsx
```

可以得到如下文件

```shell
[Content_Types].xml
_rels
	workbook.xml.rels
docProps
	app.xml
	core.xml
	custom.xml
xl
	_rels
	comments1.xml
	drawings
		vmlDrawing1.vml
	sharedStrings.xml
	styles.xml
	theme
		theme1.xml
	workbook.xml
	worksheets
		_rels
			sheet1.xml.rels
		sheet1.xml
		sheet2.xml
		sheet3.xml
```

解压结果可以直观反应`.xlsx`文件就是`.xml`文件的集合，因此后续将使用`Golang`结构体来表示文档内容的结构。
