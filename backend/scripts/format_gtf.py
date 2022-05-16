#!/usr/bin/python
# programmer : Daofeng
# usage:

# convert  gtf to refbed for browser

import sys
from urllib.parse import unquote_plus


'''
NW_023276806.1  Gnomon  transcript      34709   35129   .       +       .       transcript_id "rna-XM_035450640.1"; gene_id "gene-LOC100752894"; gene_name "LOC100752894"; Dbxref "GeneID:100752894,Genbank:XM_035450640.1"; Name "XM_035450640.1"; gbkey "mRNA"; gene "LOC100752894"; model_evidence "Supporting evidence includes similarity to: 4 Proteins%2C and 92%25 coverage of the annotated genomic feature by RNAseq alignments"; product "FGFR1 oncogene partner 2 homolog%2C transcript variant X2"; transcriptID "XM_035450640.1"; CDS_Dbxref "GeneID:100752894,Genbank:XP_035306531.1"; CDS_Name "XP_035306531.1"; CDS_gbkey "CDS"; CDS_product "FGFR1 oncogene partner 2 homolog isoform X2"; protein_id "XP_035306531.1";
NW_023276806.1  Gnomon  exon    34709   35129   .       +       .       transcript_id "rna-XM_035450640.1"; gene_id "gene-LOC100752894"; gene_name "LOC100752894";
NW_023276806.1  Gnomon  CDS     34746   35129   .       +       0       transcript_id "rna-XM_035450640.1"; gene_id "gene-LOC100752894"; gene_name "LOC100752894";

'''

def main():
    d = {}
    fin = sys.argv[1]
    fout = '{}.refbed'.format(fin)
    try:
        with open(fin,"rU") as infile:
            with open(fout,'w') as outfile:
                for line in infile:
                    if line.startswith('#'): continue
                    if line.startswith('unitig'): continue
                    if line.startswith('Scaffold'): continue
                    line = line.strip()
                    if not line: continue
                    t = line.split('\t')
                    details = {}
                    #print t
                    items = t[8].rstrip(';').split(';')
                    for item in items:
                        i = item.split()
                        details[i[0]] = i[1].strip('"')
                    if t[2].lower() == 'transcript':
                        dkey = details['gene_id']
                        if 'gene_name' in details:
                            symbol = details['gene_name'] 
                        else:
                            symbol = dkey
                        if 'product' in details:
                            desc = unquote_plus(details['product'])
                        else:
                            desc = unquote_plus(t[8])
                        d[dkey] = {'desc': desc, 'strand': t[6], 'chrom': t[0], 'start': int(t[3])-1, 'end':t[4], 'symbol': symbol, 'exonstarts': [], 'exonends': [], 'cdsstart': int(t[3])-1, 'cdsend':t[4]}
                    elif t[2].lower() == 'cds' or t[2].lower() == 'exon':
                        dkey = details['gene_id']
                        if dkey not in d:
                            print(dkey, 'error')
                        else:
                            # print(dkey,'out')
                            d[dkey]['exonstarts'].append(str(int(t[3])-1))
                            d[dkey]['exonends'].append(t[4])
                for k in d:
                    v = d[k]
                    outfile.write('{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}\t\t'.format(v['chrom'], v['start'], v['end'], v['cdsstart'], v['cdsend'], v['strand'], v['symbol'], k))
                    es = sorted(v['exonstarts'], key=lambda x:int(x))
                    ee = sorted(v['exonends'], key=lambda x:int(x))
                    outfile.write('{}\t{}\t{}\n'.format(','.join(es), ','.join(ee), v['desc']))
                        
    except IOError as message:
        print >> sys.stderr, "cannot open file",message
        sys.exit(1)

if __name__=="__main__":
    main()
