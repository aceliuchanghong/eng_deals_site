## 做一个网站

上传 .txt(之后可能srt,pdf,mobi,epub之类的) 格式的英文小说,动统计整本书的单词出现次数，并按词频高低降序排列。

自动匹配 四级(CET4)、六级(CET6)、专四、专八、托福(TOF)、雅思、GRE 等词汇等级标签。

自动匹配音标、中文释义，并直接截取原文中该单词所在的实际句子作为例句。若为小说 txt，例句标注所在章节；若为字幕 srt，例句标注所在剧集和时间戳。

允许过滤简单词（如 a, the, is）,专八等标签，只呈现目标难度词汇

允许用户导出成pdf

---

输出示例:

[753] **layer** /ˈleɪə/ `CET6` `CET4` `TOF` **6次**

*n.* 层, 产卵鸡, 放置者 *vt.* 分层堆积, 压植 [计] 层

* *n.* single thickness of usually some homogeneous substance
* *n.* a relatively thin sheetlike expanse or region lying over or under another
* *n.* a hen that lays eggs
* *n.* thin structure composed of a single thickness of cells

**[例句]**

* Morty, sTop digging for hidden layers and just be impressed. 别刨根问底了 安静地崇拜我就行 - *S03E03 01:50*
* He wishes. He wriggled back to the meta layer through a hole 才不是 他只是从第四面墙的洞 - *S06E07 02:19*
* by a paradimensional layer of infinite energy. 零质量意识场 - *S07E09 00:42*

## 安装执行

```bash
npm install
npm run dev
```
