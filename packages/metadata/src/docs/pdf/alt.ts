import { extractTextPerPage } from "@d0paminedriven/pdfdown";
import type {
  AnnotsCache,
  ImgsCache,
  ObjOfArrsEntity,
  PageWorkupAggProps
} from "@/docs/pdf/types/index.ts";
import { PdfMapperWorkup } from "./mapper/index.ts";

export class ObjectMapServiceAlt extends PdfMapperWorkup {
  private enumerableObjIdsRe = /\/\w+\d+\s((\d+\s*\d+)\s[A-Z])/g;
  private enumerableAnnotIdsRe = /(:?([\s\S]*?)0\s\w)/g;
  private annotsMatchRe = /(?:\/Annots\s*\[([\s\S]*?)\])/g;
  private imgMatchRe = /\/XObject\s*<<([\s\S]*?)>>/g;

  public getPageMap(props: ObjOfArrsEntity) {
    const m = new Map<string, PageWorkupAggProps>();
    const annotMap = this.annotsWorkup(props.aObjArr);
    const imgMap = this.imgWorkup(props.xObjArr);

    const annotIdSetTrack = new Set<string>();
    let o = 0;

    for (const { obj, id } of props.pageObjArr) {
      o++;

      const {
        pageContentId,
        pageNumber,
        structParent: structParents
      } = this.pageAgg(o, id, obj);

      let rec = {
        id,
        structParents,
        pageNumber,
        imgCounts: 0,
        annotCounts: 0,
        pageContentId,
        annotIds: new Set<string>(),
        annots: Array.of<AnnotsCache>(),
        imgIds: Array.of<string>(),
        imgs: Array.of<ImgsCache>()
      } satisfies PageWorkupAggProps;

      if (/\/XObject/.test(obj)) {
        for (const s of obj.matchAll(this.imgMatchRe)) {
          const im0 = s?.[0],
            im1 = s?.[1];
          if (im0 && im1) {
            // multiple img Ids cam be contained within a single dict
            // handle all situations exhastively -> <</Im0 57 0 R/Im0 58 0 R>>
            for (const imId of im1.matchAll(this.enumerableObjIdsRe)) {
              const in0 = imId?.[0],
                in1 = imId?.[1],
                in2 = imId?.[2];
              if (in0 && in1 && in2) {
                const id = `${in2} obj`;
                const imgRec = imgMap.get(id);
                if (imgRec?.id) {
                  rec.imgs.push(imgRec);
                  rec.imgIds.push(id);
                  rec.imgCounts += 1;
                }
              }
            }
          }
        }
      }

      if (/\/Annots/.test(obj) && !obj.startsWith("<<")) {
        for (const aa of obj.matchAll(this.annotsMatchRe)) {
          const aa0 = aa?.[0],
            aa1 = aa?.[1];
          if (aa0 && aa1) {
            for (const anId of aa1.matchAll(/(\d+)\s+0\s+R/g)) {
              const anId0 = anId?.[0],
                anId1 = anId?.[1];
              if (anId0 && anId1) {
                const objNum = anId1.trim();
                // try direct key match first, then match by object number
                const annotRec =
                  annotMap.get(`${objNum} 0`) ??
                  Array.from(annotMap.values()).find(a =>
                    a.id.startsWith(objNum + " ")
                  );
                if (annotRec?.href && !rec.annotIds.has(annotRec.id)) {
                  rec.annotIds.add(annotRec.id);
                  annotIdSetTrack.add(annotRec.id);
                  rec.annotCounts += 1;
                  rec.annots.push(annotRec);
                }
              }
            }
          }
        }
      }

      // fallback: use annotIdsMap to associate annotations with pages
      if (rec.annots.length === 0 && annotMap.size > 0) {
        const pageAnnotIds = props.annotIdsMap.get(o - 1);
        if (pageAnnotIds) {
          for (const refId of pageAnnotIds) {
            const objNum = refId.split(/\s+/)[0];
            if (!objNum) continue;
            const annotRec =
              annotMap.get(refId) ??
              annotMap.get(`${refId} obj`) ??
              Array.from(annotMap.values()).find(a =>
                a.id.startsWith(objNum + " ")
              );
            if (annotRec?.href && !rec.annotIds.has(annotRec.id)) {
              rec.annotIds.add(annotRec.id);
              annotIdSetTrack.add(annotRec.id);
              rec.annotCounts += 1;
              rec.annots.push(annotRec);
            }
          }
        }
      }

      m.set(id, rec);
    }
    const topLevelAgg = {
      totalImgs: 0,
      totalAnnots: 0,
      annotPages: new Set<number>(),
      imgPages: new Set<number>(),
      totalPages: 0,
      imgs: Array.of<
        ImgsCache & { page: number; pageId: string; pageContentId: string }
      >(),
      annots: Array.of<
        AnnotsCache & { page: number; pageId: string; pageContentId: string }
      >()
    };
    let v = 0;
    for (const [_pageId, pageVals] of Array.from(m.entries())) {
      topLevelAgg.totalPages += 1;
      const page = topLevelAgg.totalPages;
      if (pageVals.imgCounts > 0) {
        for (const img of pageVals.imgs) {
          topLevelAgg.imgs.push({
            page,
            pageId: pageVals.id,
            pageContentId: pageVals.pageContentId,
            ...img
          });
        }

        topLevelAgg.totalImgs += pageVals.imgCounts;
        topLevelAgg.imgPages.add(v + 1);
      }
      if (pageVals.annotCounts > 0) {
        for (const annot of pageVals.annots) {
          topLevelAgg.annots.push({
            page,
            pageId: pageVals.id,
            pageContentId: pageVals.pageContentId,
            ...annot
          });
        }
        topLevelAgg.totalAnnots += pageVals.annotCounts;
        topLevelAgg.annotPages.add(v + 1);
      }
      v += 1;
    }
    const { annotPages, imgPages, ...rest } = topLevelAgg;
    const annotPagesFromSet = Array.from(annotPages);
    const imgPagesFromSet = Array.from(imgPages);
    const annotIds = Array.from(annotMap);
    // const annotIdsFromSet = Array.from(annotIds);

    // const annotIdsTuple = Array.from(props.annotIdsMap);
    const annotsArr = Array.from(props.annotsMap.values());
    const newArr = Array.of<string>();
    for (const pa of props.pageObjArr) {
      if (pa.obj.length <= 20) {
        const findPage = props.examine?.find(
          v => v.includes(pa.id) || /(?:Page(?!s))/g.test(v)
        );
        if (findPage) {
          newArr.push(findPage);
        }
      }
    }

    if (props.pageObjArr.length < 1 && props.examine) {
      for (const x of props.examine) {
        if (x.includes("page")) {
          newArr.push(x);
        }
      }
    }
    if (props.pageObjArr.length > 1) {
      for (const v of props.pageObjArr) {
        newArr.push(`${v.id} ${v.obj}`);
      }
    }
    const textPerPage = extractTextPerPage(
      Buffer.isBuffer(props.rawBuff)
        ? props.rawBuff
        : Buffer.from(props.rawBuff)
    );

    return {
      version: props.version,
      linearized: props.linearized,
      xmp: props.xmp ?? undefined,
      annotPages: annotPagesFromSet,
      imgPages: imgPagesFromSet,
      ...rest,
      annotObjs: annotIds,
      s: Array.from(props.annotsMap),
      totalPages: props.countFallback,
      annotsArr,
      pages: newArr,
      examine: props.examine,
      textPerPage
      // pageIdsTuple,
      // annotsTuple,
      // annotIdsTuple,
      // examine: props.examine
    };
  }

  public pdfMapInit(buffer: Buffer | Uint8Array) {
    const arrOfObjs = this.mapIt(buffer) as ObjOfArrsEntity;
    return this.getPageMap(arrOfObjs);
  }
}
// (?:(([0-9]+\s*\d+\s*[a-z]+\s*)+)\s*([\s\S]*?))*\s*(?:stream\s*([\s\S]*?)(?:endstream|endobj))
// ((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(stream\s*([\s\S]*?)\s*endstream|endobj)

// (?:(\d+\s+\d+\s+obj\s+?|[\d\s]*))\s*?<<\/?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)

// (?:(\d+\s+\d+\s+obj\s+?|[\d\s]*))?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)
/**
 * private xmpRegex = /(<x:xmpmeta\s*(?:<*?([\s\S]*?))<\/x:xmpmeta>)/g;
private creationInfo =
  /<<(?:(?=\/CreationDate)|(?=\/Count))[\s\S]*?([\s\S]*?)>>/g;

private _streamCaptureRegex = /\s*stream\r*?\n*?([\s\S]*?)\r?\n*?endstream/g;
// (?:(([0-9]+\s*\d+\s*[a-z]+\s*)+)\s*([\s\S]*?))*\s*(?:stream\s*([\s\S]*?)(?:endstream|endobj))
// ((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(stream\s*([\s\S]*?)\s*endstream|endobj)
private _mydualcapture =
  /((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(?:stream\s*([\s\S]*?)\s*endstream|endobj)/g;
private psObjRegex = /(\d+\s+\d+\s+obj)\s*([\s\S]*?)(?:stream|endobj)/g;

private hmmm =
  /(\d+\s+\d+\s+obj\s+?|\d+\s+?)+?<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n)/g;

private comprehensive =
  /(?:(\d+\s+\d+\s+obj\s+?|\d+\s+)*?)<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|>>stream|>>endobj)/g;

private extensive =
  /(?:(\d+\s+\d+\s+obj\s+?|\d+\s+)*?)\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|>>stream|>>\s*endobj)/g;
 */
