all: compile.pdf clean

compile.pdf:
	pdflatex final.tex
	bibtex final.aux
	pdflatex final.tex
	pdflatex final.tex

clean:

	rm *.aux
	rm *.log
	rm *.bbl
	rm *.blg
	rm *.lot
	rm *.lof
	rm *.toc
	rm *.out
	rm chapters/*.log
