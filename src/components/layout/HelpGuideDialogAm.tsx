
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HelpGuideDialogAmProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpGuideDialogAm({ isOpen, onOpenChange }: HelpGuideDialogAmProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl text-center">«ተመልካች» መተግበሪያን እንዴት መጠቀም እንደሚቻል</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0 px-6"> {/* Added min-h-0 and moved horizontal padding here */}
          <div className="space-y-4 text-base py-4"> {/* Removed px-2, use ScrollArea's padding */}
            <p>
              <strong>መግቢያ፦</strong><br />
              «ተመልካች» የእርስዎን ውይይቶች በቀላሉ ለማስተዳደር እና ከአርቴፊሻል ኢንተለጀንስ (AI) ጋር ለመወያየት የተዘጋጀ መተግበሪያ ነው። ምስሎችን መላክ እና በምስሉ ላይ ተመስርቶ ምላሾችን ማግኘት ይችላሉ።
            </p>

            <h3 className="font-semibold text-lg mt-3">ዋና ዋና ገጽታዎች፦</h3>
            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>
                <strong>አዲስ ውይይት መጀመር፦</strong><br />
                በግራ በኩል ባለው የጎን አሞሌ ላይ ያለውን «አዲስ ውይይት» የሚለውን ቁልፍ ይጫኑ።
              </li>
              <li>
                <strong>መልዕክት መላክ፦</strong><br />
                በመልዕክት መላኪያ ሳጥን ውስጥ የፈለጉትን ይጻፉ። «ላክ» የሚለውን ቁልፍ (የወረቀት አውሮፕላን ምልክት) ይጫኑ ወይም ‘Enter’ን ይጫኑ።
              </li>
              <li>
                <strong>ምስል መላክ፦</strong><br />
                የወረቀት ክሊፕ (📎) ወይም የመደመር ምልክት ያለበትን የምስል አዶ (🖼️) ይጫኑ። ከመሳሪያዎ ላይ ምስል ይምረጡ። ከተፈለገ ከምስሉ ጋር አብሮ ጽሑፍ መላክ ይችላሉ።
              </li>
              <li>
                <strong>ውይይቶችን ማስተዳደር፦</strong><br />
                በግራ የጎን አሞሌ ላይ ያሉትን የውይይት ክፍለ-ጊዜዎች ማየት ይችላሉ። ውይይትን ለመቀየር ስሙን ይጫኑ። የውይይት ስም ለመቀየር የእርሳስ (✏️) ምልክቱን ይጫኑ። ውይይትን ለመሰረዝ የቆሻሻ መጣያ (🗑️) ምልክቱን ይጫኑ።
              </li>
              <li>
                <strong>ቋንቋ መቀየር፦</strong><br />
                በራስጌው ላይ ያለውን የቋንቋዎች (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-languages inline-block h-4 w-4"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1m6 17h1m-7 0h1M3 14h12"/><path d="M16 5.9a9 9 0 0 1 0 12.2"/><path d="M22 12h-6"/></svg>) አዶ በመጫን በእንግሊዝኛ እና በአማርኛ መካከል መቀያየር ይችላሉ።
              </li>
              <li>
                <strong>ገጽታ (Theme) መቀየር፦</strong><br />
                የጨረቃ (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon inline-block h-4 w-4"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>) ወይም የፀሐይ (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun inline-block h-4 w-4"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>) ምልክቱን በመጫን በቀንና በሌሊት ገጽታዎች መካከል መቀያየር ይችላሉ።
              </li>
            </ol>

            <h3 className="font-semibold text-lg mt-3">ጠቃሚ ምክሮች፦</h3>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>AIው ለጥያቄዎችዎ እና ለላኳቸው ምስሎች ምላሽ ይሰጣል።</li>
              <li>ውይይቶችዎ በመሳሪያዎ ላይ ይቀመጣሉ፤ ስለዚህ መተግበሪያውን ዘግተው ሲከፍቱ ሊያገኟቸው ይችላሉ።</li>
            </ul>
            <p className="text-center mt-4">ይህ መመሪያ እንደረዳዎት ተስፋ እናደርጋለን!</p>
          </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t"> {/* Added border-t */}
          <DialogClose asChild>
            <Button type="button">ዝጋ</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
